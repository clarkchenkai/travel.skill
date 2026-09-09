import test from 'node:test';
import assert from 'node:assert/strict';
import {expenseTotals} from '../examples/business-trip/template/modules/business.mjs';
import {validate} from '../examples/business-trip/template/validate.mjs';
test('business totals keep currencies and unknown amounts separate',()=>{
 const r=expenseTotals([{amount:{amount:10,currency:'GBP'},allocation:'company'},{amount:{amount:5,currency:'GBP'},allocation:'personal'},{amount:{amount:20,currency:'EUR'}},{amount:null}]);
 assert.equal(r.currencies.GBP.known,15);assert.equal(r.currencies.EUR.known,20);assert.equal(r.currencies.GBP.company,10);assert.equal(r.unknown,1);
});
test('business validation rejects private contacts and malformed money',()=>{
 const d={business:{privateContact:'private',expenses:[{id:'x',title:'Hotel',amount:{amount:-1,currency:'GBP'}}]}};assert.equal(validate(d).errors.length,2);
});
