import { Feature, LineString, Point } from 'geojson';
import { FeatureCollection, lineString } from '@turf/helpers';
import nearestPointOnLine from '@turf/nearest-point-on-line';
import { getCoords } from '@turf/invariant';
import { segmentEach, coordEach } from '@turf/meta';
import bbox from '@turf/bbox';
import explode from '@turf/explode';
import lineSegment from '@turf/line-segment';

function inBBox(pt: number[], box: number[]) {
  return (
    box[0] <= pt[0] && box[1] <= pt[1] && box[2] >= pt[0] && box[3] >= pt[1]
  );
}

function segmentEquals(sa: Feature<LineString>, sb: Feature<LineString>) {
  const ac = getCoords(sa);
  const bc = getCoords(sb);
  return (ac[0][0] === bc[0][0] && ac[0][1] === bc[0][1]
    && ac[1][0] === bc[1][0] && ac[1][1] === bc[1][1]);
}

function equalCoords(a: number[], b: number[]) {
  return a[0] === b[0] && a[1] === b[1];
}

function addOverlapingPoints(
  source: Feature<LineString>,
  target: Feature<LineString>,
  tolerance: number,
) {
  const targetbbox = bbox(target);
  const spts: FeatureCollection<Point> = explode(source);
  let overlaps = 0;
  coordEach(spts, (pt) => {
    if (!inBBox(getCoords(pt), targetbbox)) {
      return;
    }
    const npt: Feature<Point> = nearestPointOnLine(target, pt);

    if (npt.properties!.dist <= tolerance) {
      overlaps += 1;

      if (npt.properties!.dist === 0) {
        // same pt so do nothing
      } else {
        const { index } = npt.properties!;
        getCoords(target).splice(index + 1, 0, getCoords(pt));
      }
    }
  });
  return overlaps;
}

export function stich(a: Feature<LineString>, b: Feature<LineString>, tolerance = 0.00050) {
  // test matching a points to see of they are on the b line
  const boverlaps = addOverlapingPoints(a, b, tolerance);
  if (boverlaps === 0) return null;

  // bpts = explode(b);
  const aoverlaps = addOverlapingPoints(b, a, tolerance);
  // test matching b points to see of they are on the a line

  if (aoverlaps === 1 && boverlaps === 1) {
    // overlaps of 1 single point only
    const apts = getCoords(a); const bpts = getCoords(b);
    if (equalCoords(apts[0], bpts[0])) {
      bpts.unshift();
      bpts.reverse();
      return lineString(bpts.concat(apts));
    }
    if (equalCoords(apts[0], bpts[bpts.length - 1])) {
      apts.unshift();
      return lineString(bpts.concat(apts));
    }
    if (equalCoords(apts[apts.length - 1], bpts[0])) {
      bpts.reverse().pop();
      return lineString(apts.concat(bpts));
    }
    if (equalCoords(apts[apts.length - 1], bpts[bpts.length - 1])) {
      bpts.reverse().unshift();
      return lineString(apts.concat(bpts));
    }
    return null;
  }

  // segment both lines and look for matching segments, remove from each
  // line and join them together at the boundary
  let newCoords: Feature<LineString>[] = [];
  let segOverlaps = 0;
  const bsegs = lineSegment(b);
  let bsegsStart = 0;
  // A overlaps B
  let aOverlapsB = false;
  segmentEach(a, (sa) => {
    //  console.log("sa", getCoords(sa));
    for (let i = bsegsStart; i < bsegs.features.length; i += 1) {
      //        console.log("sb", getCoords(bsegs.features[i]));
      if (segmentEquals(sa as Feature<LineString>, bsegs.features[i])) {
        // console.log("dropping", getCoords(sa), i, "from b");
        bsegsStart = i + 1;
        segOverlaps += 1;
        if (i === 0) aOverlapsB = true;
      }
    }
    newCoords.push(sa as Feature<LineString>);
  });

  if (aOverlapsB) {
    newCoords = newCoords.concat(bsegs.features.slice(bsegsStart));
  } else {
    newCoords = bsegs.features.slice(0, segOverlaps).concat(newCoords);
  }

  const newLine = [];
  for (let i = 0; i < newCoords.length; i += 1) {
    if (i === 0) {
      newLine.push(getCoords(newCoords[i])[0]);
      newLine.push(getCoords(newCoords[i])[1]);
    } else {
      newLine.push(getCoords(newCoords[i])[1]);
    }
  }
  return lineString(newLine);
}

export function stichAll(lines: Feature<LineString>[], tolerance = 0.0005) {
  let matches = 0;
  do {
    matches = 0;
    let start = lines[0];
    for (let l = 1; l < lines.length; l += 1) {
      const stiched = stich(start, lines[l], tolerance);
      if (stiched) {
        start = stiched;

        // get rid of this entry in the array
        matches += 1;
        lines.splice(l, 1);
        l -= 1;
      } else {
        // rejects.push(lines[l]);
      }
    }
  } while (matches > 0);
  return (lines.length === 1) ? lines[0] : null;
}
