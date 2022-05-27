var Protobuf = require('pbf');
var zlib = require('zlib');
var VectorTile = require('@mapbox/vector-tile').VectorTile;
var fs = require('fs');
const { getCoords } = require("@turf/invariant");

const stich2 = require('../../routing/src/stich2.js');
const { exit, features } = require('process');
  
tile_files = [[7997, 5109], [7997, 5110], [7998, 5109], [7998, 5110]]; 
featureIds = {};
    
tile_files.forEach(tile => {
    data = fs.readFileSync('/home/neil/maps/scripts/tiles/14/' + tile[0] + '/' + tile[1] + '.pbf');
        //zlib.gunzip(data, function(err, buffer) {
            var vtile = new VectorTile(new Protobuf(data));
            console.log(vtile.layers.transportation.length);
            for (i=0; i<vtile.layers.transportation.length; i++) {
                f = vtile.layers.transportation.feature(i).toGeoJSON(tile[0], tile[1], 14);          
                if (f === undefined) {
                    console.log("undefined");
                    exit();
                }
                //console.log(getCoords(f));
                //console.log(f.id);
                if (f.geometry.type == 'LineString') {
                    featureIds[f.id] ?  featureIds[f.id].push(f) : featureIds[f.id] = [f];
                }
            }
        //});    
     

});

var gj = {
    'type': 'FeatureCollection',
    'features': []
};

var gj_short = {
    'type': 'FeatureCollection',
    'features': []
};

var gj_long = {
    'type': 'FeatureCollection',
    'features': []
};

console.log("reduce");
for (let id in featureIds) {
    var feats = featureIds[id];    
    console.log("fs", feats.length);
        if (feats.length == 1) {
            console.log("1 feature");
            gj_short.features.push(feats[0]);
                    
        } else if (feats.length > 2) {
            gj_long.features = gj_long.features.concat(feats);
        } else {
            mergedLine = feats.reduce((prev, current) => {
                stiched = stich2(prev, current);
                if (stiched == null) {
                    console.log("null return from stich!!");
                }
            });
            if (mergedLine != null) {
                gj.features.push(mergedLine);
            } else {
                gj.features = gj.features.concat(feats);
            }
        }
        
        
    
  }


fs.writeFileSync("all2lines.geojson", JSON.stringify(gj, null, 2))
fs.writeFileSync("allshortlines.geojson", JSON.stringify(gj_short, null, 2))
fs.writeFileSync("alllonglines.geojson", JSON.stringify(gj_long, null, 2))

gj_long.features.forEach(f => {
    console.log(f.id);
    console.log(f.geometry.coordinates);
});

/*
ids = [474147100, 82650215, 28721073, 49309821, 166273860, 30881106, 367913827];
ids = [474147100, 82650215, 515821413];
ids.forEach(id => {
    console.log("ids", id, featureIds[id].length);
    featureIds[id].forEach(f => {
        console.log(f.geometry.coordinates);
    });
});
*/

