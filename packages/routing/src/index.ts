import {
  Feature,
  LineString,
  Point,
  FeatureCollection,
  lineString,
  Position,
} from '@turf/helpers';
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

function isPointOnOrNearLine(pos: Position, l: Feature<LineString>, tolerance: number) {
  const npt: Feature<Point> = nearestPointOnLine(l, pos);
  return { pt: npt, match: npt.properties!.dist <= tolerance };
}

function lineAFullyContainsB(a: Feature<LineString>, b: Feature<LineString>) {

}
export function newstich(a: Feature<LineString>, b: Feature<LineString>, tolerance = 0.00050) {
  // for overlap we expect that one end of each line is on the other line.  Test for this...
  const apts = a.geometry.coordinates;
  const bpts = b.geometry.coordinates;
  // is a0 on b?

  const a0onb = isPointOnOrNearLine(apts[0], b, tolerance);
  console.log('A0', a0onb.pt);
  const anonb = isPointOnOrNearLine(
    apts[apts.length - 1], b, tolerance);
  console.log('AN', anonb.pt);
  const b0ona = isPointOnOrNearLine(bpts[0], a, tolerance);
  const bnona = isPointOnOrNearLine(
    bpts[bpts.length - 1], a, tolerance);

  let leftpts: Position[] = [];
  let rightpts: Position[] = [];

  //console.log(a0onb);
  if (a0onb.match && anonb.match) {
    if (!b0ona.match && !bnona.match) {
      // B may fully contain A - validate and then return B
      console.log('Info B may fully contain A - validate and then return B');
      // expect all A pts are on B
      let matched = false;
      for (const ap of apts) {
        if (!isPointOnOrNearLine(
          ap, b, tolerance)) {
            return null;
          }
      }
      return b;
    }
  }
  if (b0ona.match && bnona.match) {
    if (!a0onb.match && !anonb.match) {
      // A may fully contain B - validate and then return A
      console.log('// a may fully contain b - validate and then return a');
      for (const bp of bpts) {
        if (!isPointOnOrNearLine(
          bp, a, tolerance)) {
            return null;
          }
      }
      return a;
      
    }
  }



  // join left to right - orient a and b accordingly

  // end of a overlaps
  if (anonb.match) {
    leftpts = apts;
  }
  // start of b overlapped
  if (b0ona.match) {
    rightpts = bpts;
  }
  // end of b overlapped so flip b coords so beginning of line is overlapped
  if (bnona.match) {
    rightpts = bpts.reverse();
  }
  if (a0onb.match) {
    leftpts = apts.reverse();
  }



  // if we've got this far then we've got left overlapping right
  // start again (could be optimised since we already have the
  // result although indexes would need to be correct if line has been reversed)
  let leftline = lineString(leftpts);
  let rightline = lineString(rightpts);
  const leftonright = isPointOnOrNearLine(leftpts[leftpts.length - 1], rightline, tolerance);
  const rightonleft = isPointOnOrNearLine(rightpts[0], leftline, tolerance);
  console.log("BINDEX ", leftonright);
  const bindex = leftonright.pt.properties?.index;
  console.log("Bindex ", bindex);
  // export every right pt from bindex down to be on the left line (otherwise we're not overlapped)
  let overlapped = true;
  for (let i = 0; i <= bindex; i += 1) {
    const check = isPointOnOrNearLine(rightpts[i], leftline, tolerance);
    if (check.match) {
      console.log("pt matched ", i);
    } else {
      console.log("PANIC!!");
      overlapped = false;
    }
  }

  if (!overlapped) {
    console.log("Panic!!");
    return;

  }

  // so drop zero to bindex pts from right pts
  rightpts = rightpts.slice(bindex, rightpts.length);
  // and now join to leftpts and return the merged line
  leftpts = leftpts.concat(rightpts);
  a.geometry.coordinates = leftpts;

  console.log('Overlapped {}', overlapped);
  return a;



  }






/**
 * Takes two {@link LineString} arguments a and b and returns a single {@link LineString} if they
 * are either overlapping or join at single point.  Overlapping points will be added to
 * the {@link LineString}.  Also takes an optional tolerance in km (default is 0.5m)
 *
 * @name stich
 * @param {Feature<LineString>} a input line
 * @param {Feature<LineString>} b input line
 * @param {Number} tolerance in km
 * @returns {Feature<LineString>} joined and overlapping {@link LineString} or null
 * @example
 * var lineA = turf.lineString([[0, 0.1], [0, 0.2]]);
 * var lineA = turf.lineString([0.15], [0.21]]);
 *
 * var stiched = stich(lineA, lineB);
 *
 *
 */
export function stich(a: Feature<LineString>, b: Feature<LineString>, tolerance = 0.00050) {
  // test matching a points to see of they are on the b line
  const boverlaps = addOverlapingPoints(a, b, tolerance);
  if (boverlaps === 0) return null;

  // bpts = explode(b);
  const aoverlaps = addOverlapingPoints(b, a, tolerance);
  // test matching b points to see of they are on the a line
  // console.log('A', getCoords(a));
  // console.log('B', getCoords(b));
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


  // 1 2 3

  // 3 4 5



  // segment both lines and look for matching segments, remove from each
  // line and join them together at the boundary
  let newCoords: Feature<LineString>[] = [];
  let segOverlaps = 0;
  const bsegs = lineSegment(b);
  let bsegsStart = 0;
  // A overlaps B
  let aOverlapsB = false;
  segmentEach(a, (sa) => {
    // /console.log("sa", getCoords(sa));
    for (let i = bsegsStart; i < bsegs.features.length; i += 1) {
      //        console.log("sb", getCoords(bsegs.features[i]));
      if (segmentEquals(sa as Feature<LineString>, bsegs.features[i])) {
        //console.log('dropping bseg', i);
        bsegsStart = i + 1;
        segOverlaps += 1;
        //if (i === 0 || i === bsegs.features.length - 1) aOverlapsB = true;
        if (i === 0) aOverlapsB = true;
      }
    }
    newCoords.push(sa as Feature<LineString>);
  });
  //console.log('AoverB', aOverlapsB, "segOverlaps", segOverlaps);
  //console.log('BegStart', bsegsStart);

  if (aOverlapsB) {
    newCoords = newCoords.concat(bsegs.features.slice(bsegsStart));
  } else {
    newCoords = bsegs.features.slice(0, bsegsStart - 1).concat(newCoords);
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

export function flint() {
  return lineString;
}
