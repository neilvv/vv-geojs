"use strict";
var extrasgj = {
    'type': 'FeatureCollection',
    'features': []
};
var verticesgj = {
    'type': 'FeatureCollection',
    'features': []
};
var networkgj = {
    'type': 'FeatureCollection',
    'features': []
};
const map = new maplibregl.Map({
    container: 'map',
    center: [-4.2466, 55.8969],
    zoom: 14,
    minzoom: 8,
    maxzoom: 14,
    localIdeographFontFamily: "'Noto Sans', 'Noto Sans CJK SC', sans-serif",
    style: './style.json'
});
map.showTileBoundaries = true;
map.on('load', () => {
    map.on('click', add_marker);
    map.addSource('route', {
        'type': 'geojson',
        'data': {
            'type': 'FeatureCollection',
            'features': []
        }
    });
    map.addSource('network', {
        'type': 'geojson',
        'data': networkgj
    });
    map.addSource('extras', {
        'type': 'geojson',
        'data': extrasgj
    });
    map.addLayer({
        'id': 'route',
        'type': 'line',
        'source': 'route',
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': '#888',
            'line-width': 8
        }
    });
    map.addLayer({
        'filter': ['!=', 'linetype', 'Multi'],
        'id': 'network',
        'type': 'line',
        'source': 'network',
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': '#FF0000',
            'line-width': 2
        }
    });
    map.addLayer({
        'filter': ['==', 'linetype', 'Multi'],
        'id': 'network-multi',
        'type': 'line',
        'source': 'network',
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': '#48cf17',
            'line-width': 3
        }
    });
    map.addLayer({
        'id': 'park-volcanoes',
        'type': 'circle',
        'source': 'network',
        'paint': {
            'circle-radius': 6,
            'circle-color': '#B42222'
        },
        //'filter': ['==', '$type', 'Point']
    });
    map.addLayer({
        'id': 'extra-points',
        'type': 'circle',
        'source': 'extras',
        'paint': {
            'circle-radius': 6,
            'circle-color': '#000000'
        },
        //'filter': ['==', '$type', 'Point']
    });
    map.addLayer({
        'id': 'extras-line',
        'type': 'line',
        'source': 'extras',
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': '#48cf17',
            'line-width': 3
        }
    });
});
let markers = [];
var marker = new maplibregl.Marker();
var gj = {
    "name": "MyFeatureType",
    "type": "GeometryCollection",
    "geometries": []
};
//var gk2 = [];
function route(bounds) {
    host = "http://localhost:5000/";
    from = markers[markers.length - 2].getLngLat();
    console.log(from);
    to = markers[markers.length - 1].getLngLat();
    sw = bounds.getSouthWest();
    ne = bounds.getNorthEast();
    url = `${host}route/${from.lng}/${from.lat}/${to.lng}/${to.lat}/${sw.lng}/${sw.lat}/${ne.lng}/${ne.lat}`;
    console.log(url);
    fetch(url)
        .then(response => response.json())
        .then(data => {
        console.log(data);
        gj.geometries.push(data);
        map.getSource('route').setData(gj);
    });
}
function partition(array, filter) {
    let pass = [], fail = [];
    array.forEach((e, idx, arr) => (filter(e, idx, arr) ? pass : fail).push(e));
    return [pass, fail];
}
function show_routes() {
    bounds = map.getBounds();
    host = "http://localhost:5000/";
    sw = bounds.getSouthWest();
    ne = bounds.getNorthEast();
    url = `${host}routes/${sw.lng}/${sw.lat}/${ne.lng}/${ne.lat}`;
    console.log(url);
    fetch(url)
        .then(response => response.json())
        .then(data => {
        console.log(data);
        data.forEach(route => {
            console.log("adding marker");
            routem = new maplibregl.Marker({
                color: "#334455"
            });
            console.log(route[2]);
            console.log(route[3]);
            routem.setLngLat([route[2], route[3]]).addTo(map);
        });
    });
}
function undo() {
    console.log("undoing");
    console.log(gj);
    gj.geometries.pop();
    markers.pop().remove();
    console.log(gj);
}
function add_marker(event) {
    var coordinates = event.lngLat;
    console.log('Lng:', coordinates.lng, 'Lat:', coordinates.lat);
    marker.setLngLat(coordinates).addTo(map);
    markers.push(marker);
    marker = new maplibregl.Marker();
    console.log(map.getBounds());
    if (markers.length < 2) {
        //route(map.getBounds())
        return;
    }
    from = markers[markers.length - 2].getLngLat();
    console.log(from);
    to = markers[markers.length - 1].getLngLat();
    var fromPos = map.project(from);
    var toPos = map.project(to);
    [startp, startlines, sl_coords] = newLineStrings(fromPos.x, fromPos.y, from.lng, from.lat);
    [endp, endlines, el_coords] = newLineStrings(toPos.x, toPos.y, to.lng, to.lat);
    console.log("start/end: ");
    console.log(sl_coords);
    console.log(el_coords);
    // special case for === startline/endline
    if (sl_coords.length == el_coords.length && sl_coords[0][0] == el_coords[0][0]) { // worth checking..
        s = turf.lineString(sl_coords);
        e = turf.lineString(el_coords);
        if (turf.booleanEqual(s, e)) {
            // add the start point and end point and drop everything else
            console.log("start == ends");
            shortPath = turf.lineSlice(startp, endp, s);
            console.log(shortPath);
            networkgj.features = [shortPath];
            //showVerticesGeojson(pathFinder);
            map.getSource('network').setData(networkgj);
            return;
        }
    }
    // get all the lines/network
    features = map.querySourceFeatures('openmaptiles', { sourceLayer: 'transportation' });
    var [multiLineStrings, lineStrings] = partition(features, f => f.geometry.type === 'MultiLineString');
    // convert multilinestrings to linestring features
    multiLineStrings = convertMultiLineStringToLineString(multiLineStrings);
    withExtra = addVerticesAtBoundaries(multiLineStrings.concat(lineStrings));
    networkgj['features'] = withExtra.concat(startlines).concat(endlines);
    console.log('length: ' + networkgj['features'].length);
    // create the graph
    pathFinder = new PathFinder(networkgj, { precision: 1e-5 });
    console.log(startp);
    console.log(endp);
    // route between points
    path = pathFinder.findPath(startp, endp);
    // return the route
    console.log(path);
    // show the route
    f = [];
    f.push({ 'type': 'Feature',
        'geometry': {
            'type': 'LineString',
            'coordinates': path.path
        },
        'properties': {},
    });
    networkgj.features = f;
    //showVerticesGeojson(pathFinder);
    map.getSource('network').setData(networkgj);
    //showBorder(event);
}
function showBorder(e) {
    const ptFs = map.queryRenderedFeatures(e.point);
    console.log("under point");
    ptFs.forEach(f => {
        console.log(f);
        vtf = f._vectorTileFeature;
        bb = bbox(vtf._z, vtf._x, vtf._y);
        poly = turf.bboxPolygon(bb);
        networkgj.features = [poly];
        map.getSource('network').setData(networkgj);
        // get the underlying tile for the feature if present
        // get the bounding box
        // display the bounding box
    });
}
function newLineStrings(x, y, lng, lat) {
    // get the rendered features within 10 pixels
    const bbox = [
        [x - 10, y - 10],
        [x + 10, y + 10]
    ];
    // Find features intersecting the bounding box.
    var selectedFeatures = map.queryRenderedFeatures(bbox);
    //console.log(selectedFeatures);
    selectedFeatures = selectedFeatures.filter(f => {
        return (f.layer['source-layer'] === 'transportation') && (f.layer['type'] === 'line');
    });
    //console.log(selectedFeatures);
    // now find closest point on the closest line
    var pt = turf.point([lng, lat]);
    console.log("pt");
    console.log(pt);
    var closest = closest_line(pt, selectedFeatures);
    originalline = [...closest.geometry.coordinates];
    console.log(closest);
    var snapped = turf.nearestPointOnLine(closest, pt);
    //if (markers.length > 2) {
    //    markers.shift().remove();
    //}
    // turf returns a point with the "nth" poition in the linestring in properties (Turf is awesome!!)
    // make two linestrings by slitting the array of corrdinates about the index position
    //snapped.geometry.
    console.log(snapped);
    const pos = snapped.properties['index'];
    console.log(pos);
    closest.geometry.coordinates.splice(pos + 1, 0, snapped.geometry.coordinates);
    console.log(closest);
    halfA = closest.geometry.coordinates.slice(0, pos + 2);
    halfB = closest.geometry.coordinates.slice(pos + 1, closest.geometry.length);
    splitlines = [];
    splitlines.push({
        'type': 'Feature',
        'geometry': {
            'type': 'LineString',
            'coordinates': halfA
        },
        'properties': closest.properties
    });
    splitlines.push({
        'type': 'Feature',
        'geometry': {
            'type': 'LineString',
            'coordinates': halfB
        },
        'properties': closest.properties
    });
    // add a road to nowhere to avoid the two halves being compacted back to the original
    foo = [];
    splitlines.push({
        'type': 'Feature',
        'geometry': {
            'type': 'LineString',
            'coordinates': [snapped.geometry.coordinates, [1, 1]]
        },
        'properties': closest.properties
    });
    return [snapped, splitlines, originalline];
    // now get all the source features and find the one we want to remove (loop through really!!??)
}
function closest_line(pt, features) {
    if (features.length == 0) {
        return;
    }
    ;
    if (features.length == 1) {
        return features[0];
    }
    minDist = turf.pointToLineDistance(pt, features[0]);
    closest = features[0];
    features.forEach((f, i) => {
        console.log(f.id);
        distance = turf.pointToLineDistance(pt, f);
        console.log(distance);
        if ((i > 0) && (distance < minDist)) {
            closest = f;
            minDist = distance;
        }
    });
    return closest;
}
function tile2lon(x, z) {
    return (x / Math.pow(2, z) * 360 - 180);
}
function tile2lat(y, z) {
    var n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
    return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
}
function inBBox(pt, bbox) {
    return (bbox[0] <= pt[0] && bbox[1] <= pt[1] && bbox[2] >= pt[0] && bbox[3] >= pt[1]);
}
function bbox(zoom, x, y) {
    bb = [];
    //bb.north = tile2lat(y, zoom);
    //bb.south = tile2lat(y + 1, zoom);
    //bb.west = tile2lon(x, zoom);
    //bb.east = tile2lon(x + 1, zoom);
    bb.push(tile2lon(x, zoom)); // west
    bb.push(tile2lat(y + 1, zoom)); // south
    bb.push(tile2lon(x + 1, zoom)); // east
    bb.push(tile2lat(y, zoom)); //north
    return bb;
}
function show_network() {
    features = map.querySourceFeatures('openmaptiles', { sourceLayer: 'transportation' });
    console.log(features.length);
    var [multiLineStrings, lineStrings] = partition(features, f => f.geometry.type === 'MultiLineString');
    multiLineStrings = convertMultiLineStringToLineString(multiLineStrings);
    networkgj['features'] = lineStrings;
    fs = findOverlaps(multiLineStrings.concat(lineStrings));
    //fs = addVerticesAtBoundaries(multiLineStrings.concat(lineStrings));
    console.log(fs.length + " potential overlapping strings");
    networkgj['features'] = fs;
    map.getSource('network').setData(networkgj);
    //map.getSource('extras').setData(extrasgj);
    // minor, path, service, tertiary, bridge, primary,secondary, motorway
}
function findOverlaps(fs) {
    overlaps = [];
    byId = {};
    fs.forEach(o => {
        byId[o.id] ? byId[o.id].push(o) : byId[o.id] = [o];
    });
    for (const [key, value] of Object.entries(byId)) {
        if (value.length == 2) {
            var overlap = turf.lineOverlap(value[0], value[1], { "tolerance": 0.001 });
            console.log("O", overlap);
            overlaps = overlaps.concat(overlap.features);
        }
    }
    return overlaps;
}
function addVerticesAtBoundaries(fs) {
    overlaps = [];
    fs.forEach(line => {
        const vtf = line._vectorTileFeature;
        if (line.properties['linetype'] === 'Multi') {
            z = line.properties['zxy'][0];
            x = line.properties['zxy'][1];
            y = line.properties['zxy'][2];
        }
        else {
            z = vtf._z;
            x = vtf._x;
            y = vtf._y;
        }
        if (z != 15 || x != 15997 || y != 10220) {
            //return;
        }
        bb = bbox(z, x, y);
        testF = [];
        poly = turf.bboxPolygon(bb);
        //extrasgj['features'].push(poly);
        //map.getSource('network').setData(extrasgj);
        // Test each line string to see if it falls outside of the tile but only on visible edges (where there may be overlaps)
        // console.log(bb);
        if (line.geometry['type'] != 'Polygon') {
            var intersects = turf.lineIntersect(line, poly);
            testF = [];
            l = intersects.features.length;
            if (l > 0) {
                //networkgj['features'] = intersects.features;
                //map.getSource('network').setData(networkgj);
                //overlaps.push(line);
                var splitted = turf.lineSplit(line, poly);
                //console.log(intersects);
                //console.log(splitted);
                splitted.features.forEach(subline => {
                    if (turf.booleanContains(poly, subline)) {
                        //console.log("clipeed");
                        //console.log(subline);
                        overlaps.push(subline);
                    }
                    else {
                        var coords = [];
                        //console.log(line);
                        subline.geometry.coordinates.forEach(p => {
                            if (inBBox(p, bb)) {
                                //console.log("in poly");    
                                coords.push(p);
                            }
                            else {
                                console.log("pt not in bbox" + line);
                                extrasgj['features'].push(turf.point(p));
                            }
                            //console.log(p);
                        });
                        subline.geometry.coordinates = coords;
                        overlaps.push(subline);
                    }
                });
                /*
                intersects.features.forEach(ints => {
                    //console.log(ints.geometry.coordinates);
                    newPt = turf.nearestPointOnLine(line, ints);
                    if (!turf.booleanEqual(newPt, ints)) {
                        //console.log("was expecting intersect and nearest point to be the same");
                        //console.log(ints.geometry.coordinates);
                        //console.log(newPt.geometry.coordinates);
                    }
                    // get the index and then add it in
                    var index = newPt.properties['index'];
                    line.geometry.coordinates.splice(index+1, 0, ints.geometry.coordinates);
                    
                    if (!inBBox(ints.geometry.coordinates, bb)) {
                        console.log("interesct not in polygon");
                        console.log(pt.geometry.coordinates);
                        console.log(bb);
                    }
                    
                    //overlaps.push(pt);
                })
                var coords = [];
                //console.log(line);
                line.geometry.coordinates.forEach(p => {
                    if (inBBox(p, bb)) {
                        //console.log("in poly");
                        coords.push(p);
                    } else {
                        //console.log("pt not in bbox" + line);
                        //extrasgj['features'].push(turf.point(p));
                    }
                    //console.log(p);
            
            
                });
                
                line.geometry.coordinates = coords;
                */
                //console.log("new line");
                //console.log(line);
                //overlaps.push(line);
            }
        }
        else {
            console.log("Polygon!!");
        }
    });
    processOverlaps(overlaps);
    return fs;
}
function processOverlaps(overs) {
    errors = [];
    byId = {};
    overs.forEach(o => {
        byId[o.id] ? byId[o.id].push(o) : byId[o.id] = [o];
    });
    for (const [key, value] of Object.entries(byId)) {
        joined = false;
        if (value.length == 2) {
            joined = areLinesJoined(value[0], value[1]);
            if (!joined) {
                console.log(key, value.length, joined);
                errors = errors.concat(value);
            }
        }
        else if (value.length == 1) {
            //console.log(key, value.length, joined);
            //errors = errors.concat(value);
        }
        else {
            console.log(key, value.length, joined);
            //errors = errors.concat(value);
        }
    }
    console.log(errors);
    extrasgj['features'] = errors;
    extrasgj['features'] = overs;
}
function roundCoord(c, precision) {
    return [
        Math.round(c[0] / precision) * precision,
        Math.round(c[1] / precision) * precision,
    ];
}
;
/**
* Joined if start or end of either line is the same
*/
function areLinesJoined(a, b) {
    a = a.geometry.coordinates.map(p => roundCoord(p, 1e-4));
    b = b.geometry.coordinates.map(p => roundCoord(p, 1e-4));
    //console.log(a, b);
    return a[0][0] == b[0][0] && a[0][1] == b[0][1] // a[0] == b[0]
        || a[0][0] == b[b.length - 1][0] && a[0][1] == b[b.length - 1][1] // a[0] == b[end]
        || b[0][0] == a[a.length - 1][0] && b[0][1] == a[a.length - 1][1] // a[end] == b[0]
        || a[a.length - 1][0] == b[b.length - 1][0] && a[a.length - 1][1] == b[b.length - 1][1]; // a[end] == b[end]
}
function convertMultiLineStringToLineString(features) {
    lineStrings = [];
    console.log("splitting");
    features.forEach(feature => {
        //console.log(feature);
        feature.geometry.coordinates.forEach(line_coords => {
            feature.properties['linetype'] = 'Multi';
            vtf = feature._vectorTileFeature;
            feature.properties['zxy'] = [vtf._z, vtf._x, vtf._y];
            lineStrings.push({
                'type': 'Feature',
                'id': feature.id,
                'geometry': {
                    'type': 'LineString',
                    'coordinates': line_coords
                },
                'properties': feature.properties
            });
        });
    });
    return lineStrings;
}
function multilinestrings_old() {
    features = map.querySourceFeatures('openmaptiles', { sourceLayer: 'transportation' });
    var [multiLineStrings, lineStrings] = partition(features, f => f.geometry.type === 'MultiLineString');
    console.log(multiLineStrings);
    // convert multilinestrings to linestring features
    multiLineStrings = convertMultiLineStringToLineString(multiLineStrings);
    multiLineStrings.forEach(feature => {
        console.log(feature.properties);
    });
    networkgj['features'] = multiLineStrings.concat(lineStrings);
    //networkgj['features'] = lineStrings;
    map.getSource('network').setData(networkgj);
    console.log(networkgj);
    console.log(PathFinder);
    pathFinder = new PathFinder(networkgj);
    //console.log(pathFinder._graph.vertices);
    console.log(pathFinder._graph.edgeData);
    console.log(pathFinder._graph.compactedVertices);
    // minor, path, service, tertiary, bridge, primary,secondary, motorway
    showVerticesGeojson(pathFinder);
}
function multilinestrings() {
    features = map.querySourceFeatures('openmaptiles', { sourceLayer: 'transportation' });
    var [multiLineStrings, lineStrings] = partition(features, f => f.geometry.type === 'MultiLineString');
    // convert multilinestrings to linestring features
    multiLineStrings = convertMultiLineStringToLineString(multiLineStrings);
    networkgj['features'] = multiLineStrings.concat(lineStrings);
    console.log('length: ' + networkgj['features'].length);
    pathFinder = new PathFinder(networkgj);
    showVerticesGeojson(pathFinder);
}
function showVerticesGeojson(pf) {
    networkgj['features'] = [];
    vertices = [];
    for (const [key, value] of Object.entries(pf._graph.compactedVertices)) {
        //console.log(key, value);
        var coords = key.split(',');
        vertices.push({
            'type': 'Feature',
            'geometry': {
                'type': 'Point',
                'coordinates': [parseFloat(coords[0]), parseFloat(coords[1])]
            },
            'properties': {},
        });
    }
    ;
    networkgj['features'] = vertices;
    //console.log(networkgj);
    map.getSource('network').setData(networkgj);
}
function clear_network() {
    networkgj['features'] = [];
    extrasgj['features'] = [];
    map.getSource('network').setData(networkgj);
    map.getSource('extras').setData(extrasgj);
    markers.forEach(m => {
        m.remove();
    });
    var list = [];
    for (let i in window) {
        list.push(i);
    }
    console.log(list);
    console.log(this);
    // minor, path, service, tertiary, bridge, primary,secondary, motorway
}
function save_route() {
    // gjson in gj
    // name in input field
    console.log("saving route");
    let _data = {
        name: "route1",
        geojson: gj
    };
    fetch('http://localhost:5000/routes', {
        method: "POST",
        body: JSON.stringify(_data),
        headers: { "Content-type": "application/json; charset=UTF-8" }
    })
        .then(response => response.json())
        .then(json => console.log(json))
        .catch(err => console.log(err));
    // backend will work out start and end
}
function toggleBoundaries() {
    map.showTileBoundaries = !map.showTileBoundaries;
    //map.getSource('route').setData(gj);
}
function nearestpoint() {
}
document.getElementById('undo').addEventListener('click', undo);
document.getElementById('save_route').addEventListener('click', save_route);
document.getElementById('list_routes').addEventListener('click', show_routes);
document.getElementById('network').addEventListener('click', show_network);
document.getElementById('clear').addEventListener('click', clear_network);
document.getElementById('multi').addEventListener('click', multilinestrings);
document.getElementById('bounds').addEventListener('click', toggleBoundaries);
map.on('click', add_marker);
/script>;
