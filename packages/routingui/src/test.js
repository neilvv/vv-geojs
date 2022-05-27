const test = require('tape'); // assign the tape library to the variable "test"

const { lineString } = require('@turf/helpers');
const booleanEqual = require('@turf/boolean-equal').default;
const fs = require('fs');

const { stich, stichAll } = require('./index.ts'); // require the calculator module
/*
const directories = {
  in: path.join(__dirname, "test", "in") + path.sep,
  out: path.join(__dirname, "test", "out") + path.sep,
};

let fixtures = fs.readdirSync(directories.in).map((filename) => {
  return {
    filename,
    name: path.parse(filename).name,
    geojson: load.sync(directories.in + filename),
  };
});
*//*
test("vv-lib-stitch real example 1", (t) => {
  for (const { filename, name, geojson } of fixtures) {
    const [source, target] = geojson.features;
    const shared = colorize(
      lineOverlap(source, target, geojson.properties),
      "#0F0"
    );
    const results = featureCollection(shared.features.concat([source, target]));

    if (process.env.REGEN) write.sync(directories.out + filename, results);
    t.deepEquals(results, load.sync(directories.out + filename), name);
  }
  t.end();
});
*/

function save(filename, features) {
  fs.writeFileSync(filename, JSON.stringify(features, null, 2));
}

test('vv-lib-stitch real example 1', (t) => {
  let rawdata = fs.readFileSync('./test/in/real1.geojson');
  const fcol = JSON.parse(rawdata);
  const result = stich(fcol.features[0], fcol.features[1]); // expecting [0,0],[0,1],[0,2],[0,3]
  rawdata = fs.readFileSync('./test/out/real1.geojson');
  const expectedLine = JSON.parse(rawdata);
  t.deepEquals(result, expectedLine);
  // fs.writeFileSync("./test/out/real1.geojson", JSON.stringify(result, null, 2))
  t.end();
});

test('stich two overlapping lines', (t) => {
  const lineA = lineString([[0, 0.1], [0, 0.11]]);
  const lineB = lineString([[0, 0.105], [0, 0.15]]);
  const result = stich(lineA, lineB); // expecting [0,0],[0,1],[0,2],[0,3]
  const expected = lineString([[0, 0.1], [0, 0.105], [0, 0.11], [0, 0.15]]);
  // const expected = lineString([[0,3]]);
  t.true(booleanEqual(result, expected));
  // t.true(result);
  // t.deepEqual(result, expected);
  t.end();
});

test('stich two overlapping lines', (t) => {
  const lineB = lineString([[0, 0.1], [0, 0.11]]);
  const lineA = lineString([[0, 0.105], [0, 0.15]]);
  const result = stich(lineA, lineB); // expecting [0,0],[0,1],[0,2],[0,3]
  const expected = lineString([[0, 0.1], [0, 0.105], [0, 0.11], [0, 0.15]]);
  // const expected = lineString([[0,3]]);
  t.true(booleanEqual(result, expected));
  // t.true(result);
  // t.deepEqual(result, expected);
  t.end();
});

test('stich two overlapping lines with overlap of all of B', (t) => {
  const lineB = lineString([[0, 0.1], [0, 0.11]]);
  const lineA = lineString([[0, 0.099], [0, 0.105], [0, 0.15]]);
  const result = stich(lineA, lineB); // expecting [0,0],[0,1],[0,2],[0,3]
  const expected = lineString([[0, 0.099], [0, 0.1], [0, 0.105], [0, 0.11], [0, 0.15]]);
  // const expected = lineString([[0,3]]);
  t.true(booleanEqual(result, expected));
  // t.true(result);
  // t.deepEqual(result, expected);
  t.end();
});

test('stich two exactly overlapping lines', (t) => {
  const lineB = lineString([[0, 0.099], [0, 0.105], [0, 0.15]]);
  const lineA = lineString([[0, 0.099], [0, 0.105], [0, 0.15]]);
  const result = stich(lineA, lineB); // expecting [0,0],[0,1],[0,2],[0,3]
  const expected = lineString([[0, 0.099], [0, 0.105], [0, 0.15]]);
  // const expected = lineString([[0,3]]);
  t.true(booleanEqual(result, expected));
  // t.true(result);
  // t.deepEqual(result, expected);
  t.end();
});

test('stich no overlap', (t) => {
  const lineB = lineString([[0, 0.099], [0, 0.105], [0, 0.15]]);
  const lineA = lineString([[0, 0.155], [0, 0.16]]);
  const result = stich(lineA, lineB); // expecting [0,0],[0,1],[0,2],[0,3]
  // const expected = lineString([[0,3]]);
  t.equals(result, null);
  // t.true(result);
  // t.deepEqual(result, expected);
  t.end();
});

test('stich single common pt', (t) => {
  const lineB = lineString([[0, 0.099], [0, 0.105], [0, 0.15]]);
  const lineA = lineString([[0, 0.15], [0, 0.16]]);
  const result = stich(lineA, lineB); // expecting [0,0],[0,1],[0,2],[0,3]

  const expected = lineString([[0, 0.099], [0, 0.105], [0, 0.15], [0, 0.16]].reverse());

  // const expected = lineString([[0,3]]);
  t.true(booleanEqual(result, expected));
  // t.true(result);
  // t.deepEqual(result, expected);
  t.end();
});

test('stich single common pt', (t) => {
  const lineA = lineString([[0, 0.099], [0, 0.105], [0, 0.15]]);
  const lineB = lineString([[0, 0.15], [0, 0.16]]);
  const result = stich(lineA, lineB); // expecting [0,0],[0,1],[0,2],[0,3]
  const expected = lineString([[0, 0.099], [0, 0.105], [0, 0.15], [0, 0.16]].reverse());
  // const expected = lineString([[0,3]]);
  t.true(booleanEqual(result, expected));
  // t.true(result);
  // t.deepEqual(result, expected);
  t.end();
});

test('stich single common pt', (t) => {
  const lineA = lineString([[0, 0.099], [0, 0.105], [0, 0.15]].reverse());
  const lineB = lineString([[0, 0.15], [0, 0.16]].reverse());
  const result = stich(lineA, lineB); // expecting [0,0],[0,1],[0,2],[0,3]
  const expected = lineString([[0, 0.099], [0, 0.105], [0, 0.15], [0, 0.16]].reverse());
  // const expected = lineString([[0,3]]);
  t.true(booleanEqual(result, expected));
  // t.true(result);
  // t.deepEqual(result, expected);
  t.end();
});

test('stich single common pt', (t) => {
  const lineA = lineString([[0, 0.099], [0, 0.105], [0, 0.15]].reverse());
  const lineB = lineString([[0, 0.15], [0, 0.16]]);
  const result = stich(lineA, lineB); // expecting [0,0],[0,1],[0,2],[0,3]
  const expected = lineString([[0, 0.099], [0, 0.105], [0, 0.15], [0, 0.16]].reverse());
  // const expected = lineString([[0,3]]);
  t.true(booleanEqual(result, expected));
  // t.true(result);
  // t.deepEqual(result, expected);
  t.end();
});

test('stich real example', (t) => {
  const testLines = [[
    [-4.262351989746094, 55.90892348830684],
    [-4.2628079652786255, 55.90924822243457],
    [-4.262351989746094, 55.909350452986075],
  ],
  [
    [-4.261600971221924, 55.90820786090754],
    [-4.261992573738098, 55.90866490177879],
    [-4.2628079652786255, 55.90924822243457],
    [-4.2562419176101685, 55.91073655239296],
  ]];

  const lineA = lineString(testLines[0]);
  const lineB = lineString(testLines[1]);
  const result = stich(lineA, lineB); // expecting [0,0],[0,1],[0,2],[0,3]
  save('./test/out/out.geojson', result);
  const expected = lineString([[0, 0.099], [0, 0.105], [0, 0.15], [0, 0.16]].reverse());
  // const expected = lineString([[0,3]]);
  t.true(booleanEqual(result, expected));
  // t.true(result);
  // t.deepEqual(result, expected);
  t.end();
});

test('stich real example 2', (t) => {
  const testLines = [[
    [-4.262351989746094, 55.908141709808916],
    [-4.265897870063782, 55.9078259871018],
    [-4.266954660415649, 55.90768766967756],
    [-4.267764687538147, 55.907501241064324],
    [-4.26844596862793, 55.90731781848959],
    [-4.268987774848938, 55.90721858952193],
  ],
  [
    [-4.261600971221924, 55.90820786090754],
    [-4.263038635253906, 55.90808157234858],
  ],
  ];

  const lineA = lineString(testLines[0]);
  const lineB = lineString(testLines[1]);
  const result = stich(lineA, lineB); // expecting [0,0],[0,1],[0,2],[0,3]
  save('./test/out/out2.geojson', result);
  const expected = lineString([[0, 0.099], [0, 0.105], [0, 0.15], [0, 0.16]].reverse());
  // const expected = lineString([[0,3]]);
  t.true(booleanEqual(result, expected));
  // t.true(result);
  // t.deepEqual(result, expected);
  t.end();
});

test('stich real example with 3 lines', (t) => {
  const testLines = [[
    [-4.28067684173584, 55.89985689626525],
    [-4.280564188957214, 55.8998779488507],
    [-4.27992045879364, 55.89987494133919],
    [-4.279453754425049, 55.89986892631549],
    [-4.279158711433411, 55.89986291129085],
    [-4.279067516326904, 55.89986892631549],
    [-4.2789387702941895, 55.899926069003186],
    [-4.2787885665893555, 55.89992306149537],
    [-4.278643727302551, 55.89990200893442],
    [-4.278466701507568, 55.89985990377815],
    [-4.2781877517700195, 55.89993208401802],
    [-4.277801513671875, 55.90007042910236],
    [-4.277715682983398, 55.90007644409482],
    [-4.277651309967041, 55.900016294128136],
    [-4.277393817901611, 55.899763663249416],
  ],
  [
    [-4.28067684173584, 55.89985689626525],
    [-4.280564188957214, 55.8998779488507],
    [-4.27992045879364, 55.89987494133919],
    [-4.279453754425049, 55.89986892631549],
    [-4.279158711433411, 55.89986291129085],
    [-4.279067516326904, 55.89986892631549],
    [-4.2789387702941895, 55.899926069003186],
    [-4.2787885665893555, 55.89992306149537],
    [-4.278643727302551, 55.89990200893442],
    [-4.278466701507568, 55.89985990377815],
    [-4.2781877517700195, 55.89993208401802],
    [-4.277801513671875, 55.90007042910236],
    [-4.277715682983398, 55.90007644409482],
    [-4.277651309967041, 55.900016294128136],
    [-4.277034401893616, 55.89940576668832],
    [-4.276878833770752, 55.899285464581766],
    [-4.276787638664246, 55.899234336073505],
    [-4.27667498588562, 55.899183207497856],
    [-4.276487231254578, 55.89915012426596],
    [-4.276385307312012, 55.89915313183366],
  ],
  [
    [-4.28067684173584, 55.89985689626525],
    [-4.280564188957214, 55.8998779488507],
    [-4.27992045879364, 55.89987494133919],
    [-4.279453754425049, 55.89986892631549],
    [-4.279158711433411, 55.89986291129085],
    [-4.279067516326904, 55.89986892631549],
    [-4.2789387702941895, 55.899926069003186],
    [-4.2787885665893555, 55.89992306149537],
    [-4.278643727302551, 55.89990200893442],
    [-4.278466701507568, 55.89985990377815],
    [-4.2781877517700195, 55.89993208401802],
    [-4.277801513671875, 55.90007042910236],
    [-4.277715682983398, 55.90007644409482],
    [-4.277651309967041, 55.900016294128136],
    [-4.277034401893616, 55.89940576668832],
    [-4.276878833770752, 55.899285464581766],
    [-4.276787638664246, 55.899234336073505],
    [-4.27667498588562, 55.899183207497856],
    [-4.276487231254578, 55.89915012426596],
    [-4.276385307312012, 55.89915313183366],
  ]];

  const lineA = lineString(testLines[0]);
  const lineB = lineString(testLines[2]);
  let result = stich(lineA, lineB); // expecting [0,0],[0,1],[0,2],[0,3]
  // save("out2.geojson", result);
  const expected = lineString(testLines[1]);
  t.true(booleanEqual(result, expected));
  // now stich 0 to result
  result = stich(expected, lineString(testLines[1]));
  save('./test/out/merge3-2.geojson', result);
  t.end();
});

test('reduce', (t) => {
  let testLines = ['foo', 'bar', '123'];
  let res = testLines.reduce((prev, current) => prev + current);
  t.equals(res, 'foobar123');
  testLines = ['foo'];
  res = testLines.reduce((prev, current) => prev + current);
  t.equals(res, 'foo');
  t.end();
});

test('joining > 2 linestrings (nots all will overlap with each other)', (t) => {
  let a = lineString([[0, 0.10], [0, 0.11]]);
  let b = lineString([[0, 0.107], [0, 0.12]]);
  let c = lineString([[0, 0.117], [0, 0.13]]);
  let d = lineString([[0, 0.127], [0, 0.14]]);

  let lines = [a, b, c, d];

  let result = stichAll(lines);
  const expected = lineString([[0, 0.10], [0, 0.11]]);
  a = lineString([[0, 0.10], [0, 0.11]]);
  b = lineString([[0, 0.107], [0, 0.12]]);
  c = lineString([[0, 0.117], [0, 0.13]]);
  d = lineString([[0, 0.127], [0, 0.14]]);
  lines = [c, d, a, b];

  result = stichAll(lines);
  t.equals(result, expected);
  t.end();
});
