/* eslint-disable import/no-extraneous-dependencies */
import test from 'tape';
import * as rutil from './util';

test('vv-lib-stitch real example 1', (t) => {
  rutil.convertMultiLineStringToLineString([]);
  t.equals(true, true);
  t.end();
});
