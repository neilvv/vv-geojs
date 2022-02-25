var Benchmark = require('benchmark');
const stich = require('./src/stich2.js');  // require the calculator module
const { lineString } = require('@turf/helpers');
var suite = new Benchmark.Suite;

// add tests
suite.add('stich test', function() {
  lineB = lineString([[0,0.1], [0, 0.11]]);
  lineA = lineString([[0,0.105], [0,0.15]]);
  stich(lineA, lineB); 
  
})
// add listeners
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
})
// run async
.run({ 'async': true });

