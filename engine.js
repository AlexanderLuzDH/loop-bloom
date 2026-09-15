/* Copyright 2026 Busleyden. All rights reserved. */
(function(root){
  'use strict';
  function neighbors(v,n){const x=v%n,y=Math.floor(v/n);return [[x+1,y],[x,y+1],[x-1,y],[x,y-1]].filter(([a,b])=>a>=0&&b>=0&&a<n&&b<n).map(([a,b])=>b*n+a);}
  function advance(path,target,level){
    if(!Number.isInteger(target)||target<0||target>=level.n*level.n||level.rocks.includes(target))return{path,kind:'stone'};
    if(!path.length)return target===level.start?{path:[target],kind:'start'}:{path,kind:'start-first'};
    const last=path.at(-1);if(last===target)return{path,kind:'same'};
    if(!neighbors(last,level.n).includes(target))return{path,kind:'adjacent'};
    if(path.length>1&&path.at(-2)===target)return{path:path.slice(0,-1),kind:'undo'};
    if(target===level.start&&path.length>=4){
      if(!level.flowers.every(f=>path.includes(f)))return{path,kind:'flowers-first'};
      if(path.length!==level.budget)return{path,kind:'budget'};
      return{path:[...path,target],kind:'win'};
    }
    if(path.includes(target))return{path,kind:'cross'};
    const ordinal=level.flowers.indexOf(target),collected=level.flowers.filter(f=>path.includes(f)).length;
    if(ordinal>=0&&ordinal!==collected)return{path,kind:'order'};
    if(path.length>=level.budget)return{path,kind:'budget'};
    return{path:[...path,target],kind:'move'};
  }
  function distance(a,b,n){return Math.abs(a%n-b%n)+Math.abs(Math.floor(a/n)-Math.floor(b/n));}
  function lowerBound(last,next,level){let d=0;for(const f of level.flowers.slice(next)){d+=distance(last,f,level.n);last=f;}return d+distance(last,level.start,level.n);}
  // Bounded search for a hint that extends the actual player route. No hidden route reset.
  function solve(level,{prefix=[],maxSolutions=1,maxNodes=200000}={}){
    let nodes=0,truncated=false;const solutions=[],adj=Array.from({length:level.n*level.n},(_,i)=>neighbors(i,level.n)),blocked=new Set(level.rocks);
    let checked=[];
    for(const target of prefix){const r=advance(checked,target,level);if(!['start','move','win'].includes(r.kind))return{solutions,nodes,truncated};checked=r.path;}
    if(checked.length===level.budget+1){return{solutions:[checked],nodes,truncated};}
    const path=checked.length?[...checked]:[level.start],seen=new Set(path);
    function walk(v,next){
      if(++nodes>maxNodes){truncated=true;return;}
      const remaining=level.budget-(path.length-1),bound=lowerBound(v,next,level);
      if(remaining<bound||(remaining-bound)%2)return;
      if(remaining===0)return;
      for(const q of adj[v]){
        if(blocked.has(q))continue;
        if(q===level.start){if(remaining===1&&next===level.flowers.length&&path.length>=4){solutions.push([...path,q]);if(solutions.length>=maxSolutions)return;}continue;}
        if(seen.has(q)||remaining===1)continue;
        const order=level.flowers.indexOf(q);if(order>=0&&order!==next)continue;
        seen.add(q);path.push(q);walk(q,order===next?next+1:next);path.pop();seen.delete(q);
        if(truncated||solutions.length>=maxSolutions)return;
      }
    }
    walk(path.at(-1),level.flowers.filter(f=>path.includes(f)).length);return{solutions,nodes,truncated};
  }
  function signature(level){return JSON.stringify([level.n,level.start,level.budget,level.flowers,level.rocks]);}
  function restoreRun(run,level){
    if(!run||run.signature!==signature(level)||!Array.isArray(run.path)||run.path.length>level.budget||!Number.isSafeInteger(run.hints)||run.hints<0)return null;
    let path=[];for(const target of run.path){const result=advance(path,target,level);if(!['start','move'].includes(result.kind))return null;path=result.path;}
    return{path,hints:run.hints};
  }
  const api={neighbors,advance,solve,lowerBound,signature,restoreRun};if(typeof module!=='undefined')module.exports=api;root.LoopBloomEngine=api;
})(typeof window==='undefined'?globalThis:window);
