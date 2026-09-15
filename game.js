/* Copyright 2026 Busleyden. All rights reserved. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id),{levels,advance}=LoopBloom,svgNS='http://www.w3.org/2000/svg';
  let saved={scores:{},level:0,sound:false};
  try{const x=JSON.parse(localStorage.getItem('loop-bloom-v1')||'null');if(x&&typeof x==='object'){saved.scores=x.scores&&typeof x.scores==='object'?x.scores:{};saved.level=Number.isInteger(x.level)?Math.max(0,Math.min(23,x.level)):0;saved.sound=x.sound===true;}}catch{}
  let index=saved.level,level=levels[index],path=[],won=false,dragging=false,epoch=0,hintVisible=false,audio=null,notes=0;
  const flowerMarkup='<span class="flower-shape" aria-hidden="true"><i class="petal"></i><i class="petal"></i><i class="petal"></i><i class="petal"></i><i class="petal"></i><i class="flower-center"></i></span>';
  function persist(){try{localStorage.setItem('loop-bloom-v1',JSON.stringify(saved));}catch{}}
  function tone(kind='step'){
    if(!saved.sound)return;
    try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const now=audio.currentTime,scale=[261.63,293.66,329.63,392,440,523.25];
      const freqs=kind==='win'?[261.63,329.63,392,523.25]:[kind==='flower'?scale[(notes++%4)+2]:scale[(path.length%5)]];
      freqs.forEach((freq,i)=>{const o=audio.createOscillator(),g=audio.createGain(),t=now+i*.09;o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(kind==='step'?.045:.085,t+.014);g.gain.exponentialRampToValueAtTime(.001,t+.45);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+.5);});
    }catch{}
  }
  function makeSvg(name,attrs){const el=document.createElementNS(svgNS,name);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));return el;}
  function center(id){const cell=$('board').children[id],r=cell.getBoundingClientRect(),b=$('board').getBoundingClientRect();return[(r.left-b.left+r.width/2)/b.width*100,(r.top-b.top+r.height/2)/b.height*100];}
  function points(p){return p.map(center).map(a=>a.join(',')).join(' ');}
  function draw(){
    const flowers=level.flowers.filter(f=>path.includes(f)).length;
    $('flower-count').textContent=flowers+' / '+level.flowers.length;$('step-count').textContent=Math.max(0,path.length-1);
    Array.from($('board').children).forEach((c,i)=>{c.classList.toggle('visited',path.includes(i));c.classList.toggle('tip',!won&&path[path.length-1]===i);c.setAttribute('aria-pressed',String(path.includes(i)));});
    $('undo').disabled=!path.length||won;$('reset').disabled=!path.length;$('route').replaceChildren();
    if(hintVisible)$('route').appendChild(makeSvg('polyline',{class:'route-ghost',points:points(level.solution)}));
    if(path.length>1){const line=makeSvg('polyline',{class:'route-line',points:points(path)});$('route').appendChild(line);}
    if(won){const coords=path.map(center);const dot=makeSvg('circle',{class:'traveler',r:'1.6'});const animate=makeSvg('animateMotion',{dur:Math.max(2,path.length*.13)+'s',repeatCount:'indefinite',path:coords.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' ')});dot.appendChild(animate);$('route').appendChild(dot);}
  }
  function status(text){$('status').textContent=text;}
  function burst(target,large=false){
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const [x,y]=center(target);for(let i=0;i<(large?28:9);i++){const p=document.createElement('i');p.className='spark';p.style.left=x+'%';p.style.top=y+'%';const a=Math.random()*Math.PI*2,d=large?45+Math.random()*100:15+Math.random()*48;p.style.setProperty('--dx',Math.cos(a)*d+'px');p.style.setProperty('--dy',Math.sin(a)*d-25+'px');p.style.background=['#fbb1b3','#d8ef8c','#f4df9b'][i%3];$('sparks').appendChild(p);p.addEventListener('animationend',()=>p.remove(),{once:true});}
  }
  function load(i){
    epoch++;index=(i+levels.length)%levels.length;level=levels[index];path=[];won=false;dragging=false;hintVisible=false;saved.level=index;persist();
    document.querySelectorAll('dialog[open]').forEach(d=>d.close());$('board').replaceChildren();$('sparks').replaceChildren();$('board').style.gridTemplateColumns=`repeat(${level.n},1fr)`;$('board').style.gridTemplateRows=`repeat(${level.n},1fr)`;
    $('board').parentElement.classList.remove('completed');$('chapter').textContent=level.chapter;$('title').textContent=index===0?'Bring it full circle.':level.name;$('level-label').textContent=String(index+1).padStart(2,'0')+' / 24';$('par').textContent='A neat loop: '+(level.solution.length-1);
    $('instruction').textContent=index===0?'Start at the glowing ring. Visit every flower. Loop back home.':'One unbroken loop. Every flower. Back where you began.';
    for(let i=0;i<level.n*level.n;i++){
      const c=document.createElement('button');c.type='button';c.className='cell';c.dataset.cell=i;const rock=level.rocks.includes(i),flower=level.flowers.includes(i),home=i===level.start;
      if(rock)c.classList.add('stone');if(flower)c.classList.add('flower');if(home)c.classList.add('home');
      c.setAttribute('aria-label',`${home?'Start and finish':rock?'Stone':flower?'Flower':'Space'}, row ${Math.floor(i/level.n)+1}, column ${i%level.n+1}`);
      c.innerHTML=home?'<span class="home-ring" aria-hidden="true"></span>':rock?'<span class="rock" aria-hidden="true"></span>':flower?flowerMarkup:'<span class="dot" aria-hidden="true"></span>';
      c.addEventListener('click',e=>{if(e.detail===0)move(i);});
      $('board').appendChild(c);
    }
    status('Drag or tap from the ring to begin.');$('total-bloom').textContent=Object.values(saved.scores).filter(x=>Number.isInteger(x)&&x>0).length+' gardens blooming';draw();
  }
  function move(target){
    if(won)return;
    const old=path,result=advance(path,target,level);path=result.path;
    if(result.kind==='same')return;
    const errors={'stone':'Stones stay put. Find a way around.','start-first':'Begin on the glowing ring.','adjacent':'Connect neighboring spaces—up, down, left or right.','cross':'Your loop cannot cross itself. Undo to change direction.','flowers-first':'A flower is still waiting. Visit them all before returning.'};
    if(errors[result.kind]){status(errors[result.kind]);const c=$('board').children[target];if(c&&!c.classList.contains('invalid')){c.classList.add('invalid');c.addEventListener('animationend',()=>c.classList.remove('invalid'),{once:true});}return;}
    if(result.kind==='win'){
      won=true;dragging=false;hintVisible=false;const moves=path.length-1,par=level.solution.length-1,stars=moves<=par?3:moves<=par+4?2:1;
      const previous=Number(saved.scores[index])||0;saved.scores[index]=Math.max(previous,stars);persist();$('board').parentElement.classList.add('completed');status('Every flower is blooming. Your loop is complete.');draw();tone('win');level.flowers.forEach(f=>burst(f,true));
      $('stars').textContent=Array(stars).fill('✦').concat(Array(3-stars).fill('·')).join(' ');$('stars').setAttribute('aria-label',stars+' stars');$('win-copy').textContent=`${level.flowers.length} flowers connected in ${moves} steps. ${stars===3?'A lovely, tidy loop.':'Try a shorter path for another star.'}`;
      const complete=Object.values(saved.scores).filter(x=>Number(x)>0).length;$('total-bloom').textContent=complete+' gardens blooming';$('next').innerHTML=index===23?'Explore the gardens <span>▦</span>':'Next garden <span>→</span>';
      const current=epoch;setTimeout(()=>{if(epoch===current&&won)$('win').showModal();},1000);return;
    }
    const flowers=level.flowers.filter(f=>path.includes(f)).length;
    if(result.kind!=='undo'&&level.flowers.includes(target)&&!old.includes(target)){tone('flower');burst(target);}else tone();
    if(result.kind==='start')status('Follow the spaces to your first flower.');
    else if(flowers===level.flowers.length)status('All flowers connected. Now find your way back to the ring.');
    else status(flowers===0?'A little detour can open a new path.':`${level.flowers.length-flowers} ${level.flowers.length-flowers===1?'flower':'flowers'} still waiting.`);
    draw();
  }
  function undo(){if(won||!path.length)return;path.pop();hintVisible=false;status(path.length?'One step back. Try a new direction.':'Drag or tap from the ring to begin.');draw();}
  function picker(){
    $('win').close();$('level-grid').replaceChildren();levels.forEach((l,i)=>{const b=document.createElement('button');b.className=i===index?'current':'';const s=Math.max(0,Math.min(3,Number(saved.scores[i])||0));b.innerHTML=String(i+1).padStart(2,'0')+'<small>'+('✦'.repeat(s)||'·')+'</small>';b.setAttribute('aria-label',`Garden ${i+1}, ${s} stars`);b.addEventListener('click',()=>load(i));$('level-grid').appendChild(b);});$('picker').showModal();
  }
  $('board').addEventListener('pointerdown',e=>{if(e.button!==0)return;const c=e.target.closest('[data-cell]');if(!c)return;e.preventDefault();c.focus({preventScroll:true});dragging=true;move(Number(c.dataset.cell));$('board').setPointerCapture(e.pointerId);});
  $('board').addEventListener('pointermove',e=>{if(!dragging||won)return;const c=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-cell]');if(c&&c.parentElement===$('board'))move(Number(c.dataset.cell));});
  ['pointerup','pointercancel','lostpointercapture'].forEach(evt=>$('board').addEventListener(evt,()=>{dragging=false;}));
  $('board').addEventListener('keydown',e=>{
    if(e.key==='Backspace'){e.preventDefault();undo();return;}
    const directions={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};if(!directions[e.key])return;e.preventDefault();
    const current=path.length?path[path.length-1]:Number(document.activeElement?.dataset.cell??level.start),[dx,dy]=directions[e.key],x=current%level.n+dx,y=Math.floor(current/level.n)+dy;
    if(!path.length){move(level.start);$('board').children[level.start].focus();return;}
    if(x>=0&&x<level.n&&y>=0&&y<level.n){const target=y*level.n+x;move(target);$('board').children[target].focus({preventScroll:true});}
  });
  $('undo').addEventListener('click',undo);$('reset').addEventListener('click',()=>load(index));$('replay').addEventListener('click',()=>load(index));
  $('hint').addEventListener('click',()=>{if(won)return;hintVisible=!hintVisible;status(hintVisible?'The dotted line shows one possible loop. You can find your own.':'Hint hidden. Take it one space at a time.');draw();});
  $('next').addEventListener('click',()=>index===23?picker():load(index+1));$('levels').addEventListener('click',picker);$('how').addEventListener('click',()=>$('help').showModal());
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).close()));
  $('sound').addEventListener('click',()=>{saved.sound=!saved.sound;updateSound();persist();if(saved.sound)tone('flower');});
  function updateSound(){$('sound').textContent=saved.sound?'♫':'♪';$('sound').setAttribute('aria-label',saved.sound?'Turn sound off':'Turn sound on');$('sound').setAttribute('aria-pressed',String(saved.sound));$('sound').style.opacity=saved.sound?'1':'.55';}
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&audio)audio.suspend();});window.addEventListener('resize',draw);
  updateSound();load(index);
})();
