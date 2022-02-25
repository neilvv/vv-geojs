const test = require('tape'); // assign the tape library to the variable "test"
const stich = require('../src/stich.js');  // require the calculator module
const { lineString } = require('@turf/helpers');
const booleanEqual = require('@turf/boolean-equal').default;

test('stich two overlapping lines', function(t) {
  lineA = lineString([[0,0], [0, 1], [0,2]]);
  lineB = lineString([[0,1], [0,3]]);
  const result = stich(lineA, lineB); // expecting [0,0],[0,1],[0,2],[0,3]
  console.log("Result", result.geometry.coordinates);
  const expected = lineString([[0,0],[0,1],[0,2],[0,3]]);
  console.log("EXpected", expected.geometry.coordinates);
  //const expected = lineString([[0,3]]);
  t.true(booleanEqual(result, expected))
  //t.true(result);
  //t.deepEqual(result, expected);
  t.end();
});

test('stich two overlapping lines (switch a and b)', function(t) {
  lineB = lineString([[0,0], [0, 1], [0,2]]);
  lineA = lineString([[0,1], [0,3]]);
  const result = stich(lineA, lineB); // expecting [0,0],[0,1],[0,2],[0,3]
  console.log(result.geometry.coordinates);
  const expected = lineString([[0,0],[0,1],[0,2],[0,3]]);
  //const expected = lineString([[0,3]]);
  t.true(booleanEqual(result, expected))
  //t.true(result);
  //t.deepEqual(result, expected);
  t.end();
});

test('stich two overlapping lines (extra overlap)', function(t) {
  lineQ = lineString([[0,0], [0, 1], [0,2], [0,3]]);
  lineB = lineString([[0,1.25], [0, 1.5], [0,5]]);
  const result = stich(lineA, lineB); // expecting [0,0],[0,1],[0,2],[0,3]
  console.log(result.geometry.coordinates);
  const expected = lineString([[0,0],[0,1],[0,2],[0,3]]);
  //const expected = lineString([[0,3]]);
  t.true(booleanEqual(result, expected))
  //t.true(result);
  //t.deepEqual(result, expected);
  t.end();
});

/*
test('stich two non-overlapping lines', function(t) {
  const result = stich(lineA, lineB); 
  const expected = [50, 20, 10, 5];
  t.deepEqual(result, expected);
  t.end();
});
*/
/*
test('stich two overlapping lines with new point', function(t) {
  const result = stich(lineA, lineB); 
  const expected = [50, 20, 10, 5];
  t.deepEqual(result, expected);
  t.end();
});

test('stich three overlapping lines', function(t) {
  const result = stich(lineA, lineB); 
  const expected = [50, 20, 10, 5];
  t.deepEqual(result, expected);
  t.end();
});

test('stich two lines which overlap at both ends (to make a polygon)', function(t) {
  const result = stich(lineA, lineB); 
  const expected = [50, 20, 10, 5];
  t.deepEqual(result, expected);
  t.end();
});
*/

