(function(root){
  'use strict';
  function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  function neighbors(v,n){const x=v%n,y=Math.floor(v/n);return [[x+1,y],[x,y+1],[x-1,y],[x,y-1]].filter(([a,b])=>a>=0&&b>=0&&a<n&&b<n).map(([a,b])=>b*n+a);}
  function shuffled(arr,r){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function generate(index){
    if(index===0)return{n:4,start:5,solution:[5,6,7,11,15,14,13,9,5],flowers:[7,15,13],rocks:[0,2,3,12],name:'The first little loop',chapter:'01 · FIND YOUR WAY'};
    const n=index<6?4:index<15?5:6,r=rng(713+index*139),minimum=index<6?10:index<15?14:18;
    let solution=null;
    for(let attempt=0;attempt<60&&!solution;attempt++){
      const start=Math.floor(r()*n*n),path=[start],seen=new Set(path);let nodes=0;
      function walk(v){
        if(++nodes>9000)return false;
        if(path.length>=minimum&&neighbors(v,n).includes(start)){solution=[...path,start];return true;}
        if(path.length>=Math.min(n*n-2,minimum+8))return false;
        for(const q of shuffled(neighbors(v,n),r)){if(seen.has(q))continue;seen.add(q);path.push(q);if(walk(q))return true;path.pop();seen.delete(q);}return false;
      }walk(start);
    }
    if(!solution)throw new Error('No cycle for level '+index);
    const path=solution.slice(0,-1),count=Math.min(index<6?3:index<15?5:7,path.length-2);
    const flowers=[];for(let k=1;k<=count;k++)flowers.push(path[Math.floor(k*path.length/(count+1))]);
    const free=Array.from({length:n*n},(_,i)=>i).filter(i=>!path.includes(i));
    const rocks=shuffled(free,r).slice(0,Math.ceil(free.length*(index<6?.45:.7)));
    const names=['Morning dew','A gentle detour','Past the stones','Room to wander','The long way home','Quiet corners','A hidden clearing','Follow the light','Cross the meadow','A winding thought','Tangled roots','A perfect afternoon','Between the leaves','One more turn','A wider world','A curious path','The secret garden','Under the canopy','Petals in motion','A little constellation','The last sunbeam','Where paths meet','Full bloom'];
    return{n,start:path[0],solution,flowers,rocks,name:names[index-1],chapter:index<6?'01 · FIND YOUR WAY':index<15?'02 · WANDER A LITTLE':'03 · MAKE SOMETHING BEAUTIFUL'};
  }
  const levels=Array.from({length:24},(_,i)=>generate(i));
  function advance(path,target,level){
    if(!Number.isInteger(target)||target<0||target>=level.n*level.n||level.rocks.includes(target))return{path,kind:'stone'};
    if(!path.length)return target===level.start?{path:[target],kind:'start'}:{path,kind:'start-first'};
    const last=path[path.length-1];if(last===target)return{path,kind:'same'};
    if(!neighbors(last,level.n).includes(target))return{path,kind:'adjacent'};
    if(path.length>1&&path[path.length-2]===target)return{path:path.slice(0,-1),kind:'undo'};
    if(target===level.start&&path.length>=4){return level.flowers.every(f=>path.includes(f))?{path:[...path,target],kind:'win'}:{path,kind:'flowers-first'};}
    if(path.includes(target))return{path,kind:'cross'};
    return{path:[...path,target],kind:'move'};
  }
  const api={levels,neighbors,generate,advance};if(typeof module!=='undefined')module.exports=api;root.LoopBloom=api;
})(typeof window==='undefined'?globalThis:window);
