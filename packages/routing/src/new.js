const test = require('tape'); // assign the tape library to the variable "test"

const { lineString } = require('@turf/helpers');
const booleanEqual = require('@turf/boolean-equal').default;
const fs = require('fs');

const { newstich } = require('./index.ts'); // require the calculator module


test('newStich - B fully contains A', (t) => {
  let rawdata = fs.readFileSync('./test/in/real1.geojson');
  const fts = JSON.parse(rawdata);

  const lineA = fts.features[0];

  const lineB = fts.features[1];
  let result = newstich(lineA, lineB, 0.0005);

  //console.log('res', result);
  t.end();
});

test('newStich - A fully contains B', (t) => {
  let rawdata = fs.readFileSync('./test/in/real1.geojson');
  const fts = JSON.parse(rawdata);

  const lineA = fts.features[1];

  const lineB = fts.features[0];
  let result = newstich(lineA, lineB, 0.0005);



  //console.log('res', result);
  t.end();
});

test('newStich2 - end of A overlaps beginning of B', (t) => {
  let rawdata = fs.readFileSync('./test/in/real2.geojson');
  const fts = JSON.parse(rawdata);

  const lineA = fts.features[0];

  const lineB = fts.features[1];
  let result = newstich(lineA, lineB, 0.0005);
  //console.log('res', result);
  t.end();
});

test('newStich2 - begining of A overlaps end of B', (t) => {
  let rawdata = fs.readFileSync('./test/in/real2.geojson');
  const fts = JSON.parse(rawdata);

  const lineA = fts.features[0];

  const lineB = fts.features[2];
  console.log(lineB.geometry.coordinates);
  let result = newstich(lineA, lineB, 0.0005);
  //console.log('res', result);
  t.end();
});

test('newStich2 - A fully contained by B', (t) => {
  let rawdata = fs.readFileSync('./test/in/real1.geojson');
  const fts = JSON.parse(rawdata);

  const lineA = fts.features[0];

  const lineB = fts.features[1];
  console.log(lineB.geometry.coordinates);
  let result = newstich(lineA, lineB, 0.0005);
  // a fully contained by b so result should be b
  t.deepEquals(result.geometry.coordinates, lineB.geometry.coordinates);
  //console.log('res', result);
  t.end();
});

test('newStich2 - B fully contained by A', (t) => {
  let rawdata = fs.readFileSync('./test/in/real1.geojson');
  const fts = JSON.parse(rawdata);

  const lineA = fts.features[1];

  const lineB = fts.features[0];
  console.log(lineB.geometry.coordinates);
  let result = newstich(lineA, lineB, 0.0005);
  // a fully contained by b so result should be b
  t.deepEquals(result.geometry.coordinates, lineA.geometry.coordinates);
  //console.log('res', result);
  t.end();
});

