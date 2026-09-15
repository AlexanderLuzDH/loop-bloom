const assert=require('node:assert/strict');
const {levels,advance,neighbors}=require('./levels.js');
for(const [i,l] of levels.entries()){
  assert.equal(new Set(l.solution.slice(0,-1)).size,l.solution.length-1,`self-intersection ${i}`);
  assert.equal(l.solution[0],l.start);assert.equal(l.solution.at(-1),l.start);
  assert.ok(l.flowers.every(f=>l.solution.includes(f)&&f!==l.start));
  assert.ok(l.rocks.every(r=>!l.solution.includes(r)));
  let p=[];for(const t of l.solution){const r=advance(p,t,l);assert.ok(['start','move','win'].includes(r.kind),`level ${i}: ${r.kind}`);p=r.path;}
  assert.equal(p.length,l.solution.length);assert.equal(advance([],l.flowers[0],l).kind,'start-first');
  if(l.rocks.length)assert.equal(advance([l.start],l.rocks[0],l).kind,'stone');
  const begun=[l.start,l.solution[1]];assert.deepEqual(advance(begun,l.start,l).path,[l.start]);
}
const l=levels[0];assert.equal(advance([5],15,l).kind,'adjacent');
assert.equal(advance([5,6,10,9],5,l).kind,'flowers-first');
assert.equal(advance([5,6,7,11,10],6,l).kind,'cross');
assert.equal(advance([],99,l).kind,'stone');
console.log(`Verified ${levels.length} solvable gardens, path rules, backtracking, early-return rejection and self-crossing rejection.`);
