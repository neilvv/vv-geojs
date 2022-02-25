const { lineString } = require('@turf/helpers');
const lineOverlap = require('@turf/line-overlap').default;
import rbush from "@turf/geojson-rbush";
import lineSegment from "@turf/line-segment";
import nearestPointOnLine from "@turf/nearest-point-on-line";
import booleanPointOnLine from "@turf/boolean-point-on-line";
import { getCoords } from "@turf/invariant";
import { featureEach, segmentEach } from "@turf/meta";

module.exports = function stich(a, b, tolerance = 0) {
    overlaps = lineOverlap(a, b); // return a feature collection of overlap lines
    canBeStiched = false;
    overlaps.features.forEach(f => {
        console.log('a', a.geometry.coordinates);
        console.log('b', b.geometry.coordinates);
        console.log('o', f.geometry.coordinates);
        // expect that for each overlap one end is also matching an endpoint
        // of one of the candidate lines
        opts = f.geometry.coordinates;
        apts = a.geometry.coordinates;
        bpts = b.geometry.coordinates;

        oStart = [];
        oEnd = [];

    
        [startTarget, startIndex] = findTarget(opts[0], apts, bpts);
        [endTarget, endIndex] = findTarget(opts[opts.length-1], apts, bpts);
        
        console.log("S", startTarget, startIndex);
        console.log("E", endTarget, endIndex);
        i = startIndex;
        i = 0; j= 0;
        newStart = [];
        while (i<opts.length) {
                if (equalCoords(opts[i], startTarget[j])) {
                    i++; j++; 
                }
                else {
                    //newStart.push(opts[i]);
                     i++;
                }
                
            }
            
            console.log(j, startTarget.slice(j));
            newStart = newStart.concat(startTarget.slice(j));
            console.log("NS:", newStart);
        
            newEnd = [];
        i = endTarget.length-1;
        j = opts.length-1;
        while (j>=0) {
            if (equalCoords(opts[j], endTarget[i])) {
                //newEnd.push(endTarget[i]);
                 i--; j--; 
            }
            else {
                newEnd.push(opts[j]); j--;
            }
            
        }
        console.log("E", newEnd);
        console.log(j, endTarget.slice(0, j-1));
        newEnd = endTarget.slice(0, j-1).concat(newEnd.reverse());
        
        // j gives us the number of pts to lose
            
        console.log('ne', newEnd);
            
        
        
    });   


    
    return lineString(newEnd.concat(opts).concat(newStart));
    //return lineString([[0,0], [0,1]]);

};

function findTarget(target, a, b) {
    if (equalCoords(target, a[0])) return [a, 0];
    else if (equalCoords(target, a[a.length-1])) return [a, a.length-1];
    else if (equalCoords(target, b[0])) return [b, 0];
    else if (equalCoords(target, b[b.length-1])) return [b, b.length-1];
    else return [[], 0];
        
};


function equalCoords(a, b) {
    return a[0] == b[0] && a[1] == b[1];
}


function foo(f) {
    featureEach(, function (match) {

}