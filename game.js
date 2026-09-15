/* Copyright 2026 Busleyden. All rights reserved. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id),{levels,advance,solve,lowerBound,signature,restoreRun}=LoopBloom,svgNS='http://www.w3.org/2000/svg';
  const storageKey='loop-bloom-v2';
  let saved={scores:{},runs:{},level:0,sound:false};
  try{const x=JSON.parse(localStorage.getItem(storageKey)||'null');if(x&&typeof x==='object'){saved.scores=x.scores&&typeof x.scores==='object'&&!Array.isArray(x.scores)?x.scores:{};saved.runs=x.runs&&typeof x.runs==='object'&&!Array.isArray(x.runs)?x.runs:{};saved.level=Number.isInteger(x.level)?Math.max(0,Math.min(levels.length-1,x.level)):0;saved.sound=x.sound===true;}}catch{}
  const requested=new URLSearchParams(location.search).get('level');
  if(requested&&/^\d+$/.test(requested)&&Number(requested)>=1&&Number(requested)<=levels.length)saved.level=Number(requested)-1;
  let index=saved.level,level=levels[index],path=[],won=false,dragging=false,epoch=0,hintPath=[],hints=0,audio=null;
  function persist(){try{localStorage.setItem(storageKey,JSON.stringify(saved));}catch{}}
  function saveRun(){if(won||(!path.length&&!hints))delete saved.runs[index];else saved.runs[index]={signature:signature(level),path:[...path],hints};persist();}
  function tone(kind='step'){
    if(!saved.sound)return;
    try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const now=audio.currentTime;
      const freqs=kind==='win'?[261.63,329.63,392,523.25]:[kind==='flower'?440:261.63+path.length*12];
      freqs.forEach((freq,i)=>{const o=audio.createOscillator(),g=audio.createGain(),t=now+i*.09;o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+.014);g.gain.exponentialRampToValueAtTime(.001,t+.35);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+.4);});
    }catch{}
  }
  function makeSvg(name,attrs){const el=document.createElementNS(svgNS,name);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));return el;}
  function center(id){const c=$('board').children[id],r=c.getBoundingClientRect(),b=$('board').getBoundingClientRect();return[(r.left-b.left+r.width/2)/b.width*100,(r.top-b.top+r.height/2)/b.height*100];}
  function points(p){return p.map(center).map(a=>a.join(',')).join(' ');}
  function collected(){return level.flowers.filter(f=>path.includes(f)).length;}
  function status(text){$('status').textContent=text;}
  function draw(){
    const flowers=collected(),moves=Math.max(0,path.length-1),left=level.budget-moves;
    $('flower-count').textContent=flowers+' / '+level.flowers.length;$('step-count').textContent=moves+' / '+level.budget;
    $('par').textContent=won?(hints?'Assisted solve':'Unassisted solve'):left+' moves left';
    Array.from($('board').children).forEach((c,i)=>{c.classList.toggle('visited',path.includes(i));c.classList.toggle('tip',!won&&path.at(-1)===i);c.classList.toggle('next-flower',!won&&i===level.flowers[flowers]);c.setAttribute('aria-pressed',String(path.includes(i)));});
    $('undo').disabled=!path.length||won;$('reset').disabled=!path.length&&!hints;$('hint').disabled=won;$('route').replaceChildren();
    if(hintPath.length)$('route').appendChild(makeSvg('polyline',{class:'route-ghost',points:points(hintPath)}));
    if(path.length>1)$('route').appendChild(makeSvg('polyline',{class:'route-line',points:points(path)}));
    if(won){const dot=makeSvg('circle',{class:'traveler',r:'1.5'});dot.appendChild(makeSvg('animateMotion',{dur:'3s',repeatCount:'indefinite',path:path.map(center).map((p,i)=>(i?'L':'M')+p.join(' ')).join(' ')}));$('route').appendChild(dot);}
    $('hint-note').textContent=hints?'Hint used · this solve is assisted':'No timer. Undo as often as you need.';
  }
  function load(i,restart=false){
    epoch++;index=Math.max(0,Math.min(levels.length-1,i));level=levels[index];path=[];won=false;dragging=false;hintPath=[];hints=0;
    const resumed=restart?null:restoreRun(saved.runs[index],level);
    if(resumed){path=resumed.path;hints=resumed.hints;}else delete saved.runs[index];
    saved.level=index;persist();
    const url=new URL(location.href);if(url.searchParams.has('level')){url.searchParams.set('level',String(index+1));history.replaceState(null,'',url);}
    document.querySelectorAll('dialog[open]').forEach(d=>d.close());$('board').replaceChildren();$('sparks').replaceChildren();$('board').style.gridTemplateColumns=`repeat(${level.n},1fr)`;$('board').style.gridTemplateRows=`repeat(${level.n},1fr)`;
    $('board').parentElement.classList.remove('completed');$('chapter').textContent=level.chapter;$('title').textContent=level.name;$('level-label').textContent=String(index+1).padStart(2,'0')+' / '+levels.length;
    $('instruction').textContent=`Visit flowers 1–${level.flowers.length} in order. Return home in exactly ${level.budget} moves. No crossing.`;
    $('difficulty').textContent=level.difficulty+' · '+level.n+' × '+level.n;
    document.querySelectorAll('[data-jump]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.jump)===(index<2?0:index<8?2:8))));
    for(let i=0;i<level.n*level.n;i++){
      const c=document.createElement('button');c.type='button';c.className='cell';c.dataset.cell=i;const rock=level.rocks.includes(i),ordinal=level.flowers.indexOf(i),home=i===level.start;
      if(rock)c.classList.add('stone');if(ordinal>=0)c.classList.add('flower');if(home)c.classList.add('home');
      c.setAttribute('aria-label',`${home?'Home':rock?'Stone':ordinal>=0?'Flower '+(ordinal+1):'Space'}, row ${Math.floor(i/level.n)+1}, column ${i%level.n+1}`);
      c.innerHTML=home?'<span class="home-ring" aria-hidden="true"></span>':rock?'<span class="rock" aria-hidden="true"></span>':ordinal>=0?'<span class="waypoint" aria-hidden="true">'+(ordinal+1)+'</span>':'<span class="dot" aria-hidden="true"></span>';
      c.addEventListener('click',e=>{if(e.detail===0)move(i);});$('board').appendChild(c);
    }
    status(resumed&&(path.length||hints)?'Your unfinished route is restored. Pick up where you left off.':index<2?'Begin at the ring. The numbers set the order.':'Plan the return path before you commit.');
    $('total-bloom').textContent=Object.keys(saved.scores).filter(k=>Number(saved.scores[k])>0).length+' / '+levels.length+' solved';draw();
  }
  function move(target){
    if(won)return;const result=advance(path,target,level);
    if(result.kind==='same')return;
    const errors={stone:'That space is blocked.', 'start-first':'Begin on the home ring.',adjacent:'Move one space up, down, left or right.',cross:'That space is already in your route. Undo to change it.','flowers-first':'Visit every numbered flower before returning home.',order:'Flower '+(collected()+1)+' comes next. Keep the order.',budget:'The loop needs exactly '+level.budget+' moves. Undo and reroute.'};
    if(errors[result.kind]){status(errors[result.kind]);const c=$('board').children[target];if(c&&!c.classList.contains('invalid')){c.classList.add('invalid');c.addEventListener('animationend',()=>c.classList.remove('invalid'),{once:true});}return;}
    path=result.path;hintPath=[];
    if(result.kind==='win'){
      won=true;dragging=false;const score=hints?1:3;saved.scores[index]=Math.max(Number(saved.scores[index])||0,score);saveRun();$('board').parentElement.classList.add('completed');status('Route complete. Every move accounted for.');draw();tone('win');
      $('stars').textContent=hints?'ASSISTED':'UNASSISTED';$('stars').setAttribute('aria-label',hints?'Assisted solve':'Unassisted solve');$('win-copy').textContent=`${level.flowers.length} checkpoints. ${level.budget} moves. ${hints?'Try again without hints to master this puzzle.':'You found an optimal route.'}`;
      $('total-bloom').textContent=Object.keys(saved.scores).filter(k=>Number(saved.scores[k])>0).length+' / '+levels.length+' solved';$('next').textContent=index===levels.length-1?'Choose a puzzle':'Next puzzle →';
      const current=epoch;setTimeout(()=>{if(epoch===current&&won)$('win').showModal();},650);return;
    }
    saveRun();const count=collected(),left=level.budget-(path.length-1),bound=lowerBound(path.at(-1),count,level);
    tone(level.flowers.includes(target)?'flower':'step');
    if(result.kind==='start')status('Flower 1 first. Keep a route home open.');
    else if(left<bound)status('Too few moves remain to reach every stop. Undo to recover.');
    else status(count===level.flowers.length?'All checkpoints reached. Return to the ring.':'Next: flower '+(count+1)+'. '+left+' moves remain.');draw();
  }
  function undo(){if(won||!path.length)return;path.pop();hintPath=[];saveRun();status(path.length?'Route revised. Keep the return path open.':'Begin at the home ring.');draw();}
  function hint(){
    if(won)return;const prefix=path.length?path:[level.start],result=solve(level,{prefix});
    if(result.truncated){status('This route needs more analysis. Try undoing a move.');return;}
    if(result.solutions.length){hints++;saveRun();const route=result.solutions[0];hintPath=route.slice(Math.max(0,prefix.length-1),prefix.length+1);status(path.length?'The dotted segment shows one next move.':'Begin at home, then follow the one dotted segment.');draw();return;}
    for(let keep=prefix.length-1;keep>=1;keep--){const attempt=solve(level,{prefix:prefix.slice(0,keep)});if(attempt.truncated){status('Try undoing a move to find a new route.');return;}if(attempt.solutions.length){hints++;saveRun();hintPath=[];status('This route cannot finish in '+level.budget+' moves. Undo '+(prefix.length-keep)+' '+(prefix.length-keep===1?'move':'moves')+' and try another direction.');draw();return;}}
  }
  function picker(){
    $('win').close();$('level-grid').replaceChildren();levels.forEach((l,i)=>{const b=document.createElement('button'),s=Number(saved.scores[i])||0,run=restoreRun(saved.runs[i],l),inProgress=run&&(run.path.length||run.hints);b.className=i===index?'current':'';b.innerHTML=String(i+1).padStart(2,'0')+'<small>'+l.difficulty+'</small><small>'+(inProgress?'↳ Continue':s===3?'◆ Mastered':s?'◇ Assisted':l.budget+' moves')+'</small>';b.setAttribute('aria-label',`Puzzle ${i+1}, ${l.difficulty}, ${l.budget} moves, ${inProgress?'in progress':s===3?'mastered':s?'assisted':'unsolved'}`);b.addEventListener('click',()=>load(i));$('level-grid').appendChild(b);});$('picker').showModal();
  }
  $('board').addEventListener('pointerdown',e=>{if(e.button!==0)return;const c=e.target.closest('[data-cell]');if(!c)return;e.preventDefault();c.focus({preventScroll:true});dragging=true;move(Number(c.dataset.cell));$('board').setPointerCapture(e.pointerId);});
  $('board').addEventListener('pointermove',e=>{if(!dragging||won)return;const c=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-cell]');if(c&&c.parentElement===$('board'))move(Number(c.dataset.cell));});
  ['pointerup','pointercancel','lostpointercapture'].forEach(evt=>$('board').addEventListener(evt,()=>dragging=false));
  $('board').addEventListener('keydown',e=>{
    if(e.key==='Backspace'){e.preventDefault();undo();return;}
    const directions={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};if(!directions[e.key])return;e.preventDefault();
    if(!path.length){move(level.start);$('board').children[level.start].focus();return;}
    const current=path.at(-1),[dx,dy]=directions[e.key],x=current%level.n+dx,y=Math.floor(current/level.n)+dy;
    if(x>=0&&x<level.n&&y>=0&&y<level.n){const target=y*level.n+x;move(target);$('board').children[target].focus({preventScroll:true});}
  });
  $('undo').addEventListener('click',undo);$('reset').addEventListener('click',()=>load(index,true));$('replay').addEventListener('click',()=>load(index,true));$('hint').addEventListener('click',hint);
  $('next').addEventListener('click',()=>index===levels.length-1?picker():load(index+1));$('levels').addEventListener('click',picker);$('how').addEventListener('click',()=>$('help').showModal());
  document.querySelectorAll('[data-jump]').forEach(b=>b.addEventListener('click',()=>load(Number(b.dataset.jump))));
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).close()));
  $('sound').addEventListener('click',()=>{saved.sound=!saved.sound;updateSound();persist();if(saved.sound)tone('flower');});
  function updateSound(){$('sound').textContent=saved.sound?'♫':'♪';$('sound').setAttribute('aria-label',saved.sound?'Turn sound off':'Turn sound on');$('sound').setAttribute('aria-pressed',String(saved.sound));}
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&audio)audio.suspend();});window.addEventListener('resize',draw);
  updateSound();load(index);
})();
