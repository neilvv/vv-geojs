import { lineString, point, } from '@turf/helpers';
import booleanEqual from '@turf/boolean-equal';
import lineSlice from '@turf/line-slice';
import pointToLineDistance from '@turf/point-to-line-distance';
import nearestPointOnLine from '@turf/nearest-point-on-line';
import routing from './routing';
import PathFinder from './geojson-path-finder';
export function convertMultiLineStringToLineString(features) {
    const lineStrings = [];
    features.forEach((feature) => {
        const f = feature;
        feature.geometry.coordinates.forEach((lineCoords) => {
            if (!f.properties) {
                f.properties = {};
            }
            f.properties.linetype = 'Multi';
            const vtf = feature._vectorTileFeature;
            f.properties.zxy = [vtf._z, vtf._x, vtf._y];
            lineStrings.push({
                type: 'Feature',
                id: feature.id,
                geometry: {
                    type: 'LineString',
                    coordinates: lineCoords,
                },
                properties: feature.properties,
            });
        });
    });
    return lineStrings;
}
export function partition(features, filter) {
    const pass = [];
    const fail = [];
    features.forEach((e, idx, arr) => (filter(e, idx, arr) ? pass : fail).push(e));
    return [pass, fail];
}
function closestLine(pt, features) {
    if (features.length === 0) {
        return null;
    }
    if (features.length === 1) {
        return features[0];
    }
    let minDist = pointToLineDistance(pt, features[0]);
    let closest = features[0];
    features.forEach((f, i) => {
        const distance = pointToLineDistance(pt, f);
        if ((i > 0) && (distance < minDist)) {
            closest = f;
            minDist = distance;
        }
    });
    return closest;
}
/**
 *
 * @param x pixel x pos
 * @param y pixel y pos
 * @param lng
 * @param lat
 * @param map
 * @returns
 */
function newLineStrings(x, y, lng, lat, map) {
    // get the rendered features within 10 pixels
    const box = [
        [x - 10, y - 10],
        [x + 10, y + 10],
    ];
    // Find features intersecting the bounding box.
    let selectedFeatures = map.queryRenderedFeatures(box);
    selectedFeatures = selectedFeatures.filter((f) => (f.layer['source-layer'] === 'transportation') && (f.layer.type === 'line'));
    // now find closest point on the closest line
    const pt = point([lng, lat]);
    const closest = closestLine(pt, selectedFeatures);
    if (!closest) {
        return [];
    }
    const originalline = [...closest.geometry.coordinates];
    const snapped = nearestPointOnLine(closest, pt);
    // make two linestrings by slitting the array of corrdinates about the index position
    const pos = snapped.properties.index;
    closest.geometry.coordinates.splice(pos + 1, 0, snapped.geometry.coordinates);
    const halfA = closest.geometry.coordinates.slice(0, pos + 2);
    const halfB = closest.geometry.coordinates.slice(pos + 1, closest.geometry.coordinates.length);
    const splitlines = [];
    splitlines.push(lineString(halfA, closest.properties));
    splitlines.push(lineString(halfB, closest.properties));
    // add a road to nowhere to avoid the two halves being compacted back to the original
    splitlines.push(lineString([snapped.geometry.coordinates, [1, 1]], closest.properties));
    const retValues = [snapped, splitlines, originalline];
    return retValues;
    // now get all the source features and find the one we want to remove (loop through really!!??)
}
export function addMarker(markers, event, marker, map) {
    const coordinates = event.lngLat;
    marker.setLngLat(coordinates).addTo(map);
    markers.push(marker);
    if (markers.length < 2) {
        return;
    }
    const from = markers[markers.length - 2].getLngLat();
    const to = markers[markers.length - 1].getLngLat();
    const fromPos = map.project(from);
    const toPos = map.project(to);
    const [startp, startlines, slCoords] = newLineStrings(fromPos.x, fromPos.y, from.lng, from.lat, map);
    const [endp, endlines, elCoords] = newLineStrings(toPos.x, toPos.y, to.lng, to.lat, map);
    // special case for === startline/endline
    if (slCoords.length === elCoords.length && slCoords[0][0] === elCoords[0][0]) {
        const s = lineString(slCoords);
        const e = lineString(elCoords);
        if (booleanEqual(s, e)) {
            // add the start point and end point and drop everything else
            lineSlice(startp, endp, s);
            return;
        }
    }
    // get all the lines/network
    const features = map.querySourceFeatures('openmaptiles', { sourceLayer: 'transportation', filter: [] });
    const [multiLineStrings, lineStrings] = partition(features, (f) => f.geometry.type === 'MultiLineString');
    // convert multilinestrings to linestring features
    let withExtra = convertMultiLineStringToLineString(multiLineStrings);
    withExtra = multiLineStrings.concat(lineStrings);
    withExtra = withExtra.concat(startlines).concat(endlines);
    // create the graph
    const pathFinder = new PathFinder(withExtra, { precision: 1e-5 });
    // route between points
    const path = pathFinder.findPath(startp, endp);
    // return the route
    // show the route
    const f = [];
    f.push({
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: path.path,
        },
        properties: {},
    });
}
export function tile2lon(x, z) {
    return ((x / (2 ** z)) * 360) - 180;
}
export function tile2lat(y, z) {
    const n = Math.PI - (2 * (Math.PI * y)) / 2 ** z;
    return ((180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
}
export function inBBox(pt, box) {
    return (box[0] <= pt[0] && box[1] <= pt[1] && box[2] >= pt[0] && box[3] >= pt[1]);
}
export function bbox(zoom, x, y) {
    const bb = [];
    bb.push(tile2lon(x, zoom)); // west
    bb.push(tile2lat(y + 1, zoom)); // south
    bb.push(tile2lon(x + 1, zoom)); // east
    bb.push(tile2lat(y, zoom)); // north
    return bb;
}
export function processOverlaps(overs) {
    const byId = {};
    overs.forEach((o) => {
        const { id } = o;
        if (byId[id]) {
            byId[id].push(o);
        }
        else {
            byId[id] = [o];
        }
    });
    Object.entries(byId).forEach(([, values]) => {
        stichAll(values);
    });
}
export function roundCoord(c, precision) {
    return [
        Math.round(c[0] / precision) * precision,
        Math.round(c[1] / precision) * precision,
    ];
}
export function fred() {
    let i = 1;
    i = 1 + i;
    routing.flint();
}
