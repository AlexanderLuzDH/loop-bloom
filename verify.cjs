const assert=require('node:assert/strict');
const {levels,advance,solve,lowerBound,neighbors,signature,restoreRun}=require('./levels.js');
const metrics=require('./curation.json');
for(const [i,l] of levels.entries()){
  assert.equal(new Set(l.solution.slice(0,-1)).size,l.budget,`self-intersection ${i}`);
  assert.equal(l.solution[0],l.start);assert.equal(l.solution.at(-1),l.start);
  assert.deepEqual(l.solution.filter(f=>l.flowers.includes(f)),l.flowers);
  assert.ok(l.rocks.every(r=>!l.solution.includes(r)));
  let p=[];for(const t of l.solution){const r=advance(p,t,l);assert.ok(['start','move','win'].includes(r.kind),`level ${i+1}: ${r.kind}`);p=r.path;}
  assert.equal(p.length,l.budget+1);
  for(let budget=Math.max(4,lowerBound(l.start,0,l));budget<l.budget;budget+=2){const r=solve({...l,budget},{maxNodes:1000000});assert.equal(r.truncated,false);assert.equal(r.solutions.length,0,`shorter route in ${i+1}`);}
  for(const end of [2,Math.floor(l.solution.length/2),l.solution.length-2]){const prefix=l.solution.slice(0,end),r=solve(l,{prefix});assert.equal(r.truncated,false);assert.equal(r.solutions.length,1);assert.deepEqual(r.solutions[0].slice(0,end),prefix,'hint must preserve route');}
  assert.deepEqual(advance(l.solution.slice(0,2),l.start,l).path,[l.start]);
  assert.equal(advance([],l.flowers[0],l).kind,'start-first');
  if(i>=2){assert.ok(metrics[i].traps>=2);assert.ok(metrics[i].branches/l.budget>=.55);}
  for(const trap of metrics[i].trapExamples){const r=advance(trap.prefix,trap.next,l);assert.equal(r.kind,'move');const solved=solve(l,{prefix:r.path});assert.equal(solved.truncated,false);assert.equal(solved.solutions.length,0);}
}
const square={n:3,start:0,flowers:[2,8],rocks:[],budget:8};
assert.equal(advance([0,1,4,5],8,square).kind,'order');
assert.equal(advance([0,1,2,5,4,3],0,square).kind,'flowers-first');
assert.equal(advance([0,1,2,5,8,7,4,3],0,{...square,budget:10}).kind,'budget');
assert.equal(advance([0,1,2,5,4],1,square).kind,'cross');
assert.equal(advance([0,1],8,square).kind,'adjacent');
assert.equal(advance([],99,square).kind,'stone');
assert.equal(solve(square,{prefix:[0,1,4,5,8]}).solutions.length,0,'invalid prefix must not generate hint');
const resumeLevel=levels[8],run={signature:signature(resumeLevel),path:resumeLevel.solution.slice(0,8),hints:2};
assert.deepEqual(restoreRun(run,resumeLevel),{path:run.path,hints:2});
assert.notEqual(restoreRun(run,resumeLevel).path,run.path,'restored path must not alias saved data');
assert.equal(restoreRun({...run,signature:'older puzzle'},resumeLevel),null);
assert.equal(restoreRun({...run,hints:-1},resumeLevel),null);
assert.equal(restoreRun({...run,path:resumeLevel.solution},resumeLevel),null,'completed routes should not resume as unfinished');
assert.equal(restoreRun({...run,path:[resumeLevel.start,99]},resumeLevel),null);
assert.equal(restoreRun({...run,path:[resumeLevel.start,resumeLevel.solution[1],resumeLevel.start]},resumeLevel),null,'saved data must contain the resulting path, not undo commands');
assert.equal(restoreRun({signature:signature(square),path:[0,1,4,5,8],hints:0},square),null,'reject out-of-order checkpoint in saved data');
assert.deepEqual(restoreRun({...run,path:[],hints:1},resumeLevel),{path:[],hints:1},'hint usage before the first move must survive reload');
console.log(`PASS: ${levels.length} boards; exact minimum budgets; ordered checkpoints; no crossing; undo; prefix-consistent hints; ${metrics.reduce((s,l)=>s+l.traps,0)} verified misleading branches.`);
console.log('PASS: saved-route validation, puzzle signature, hint history and safe recovery from invalid saves.');
