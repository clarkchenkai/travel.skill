import React,{useEffect,useRef,useState} from 'react';
import FlightCollage from './FlightCollage.jsx';
import WindOpening from './WindOpening.jsx';
const links=[['route','地图'],['itinerary','日程'],['transport','交通'],['prep','清单']];
// Generated figures have unequal bounds; isolate each without neighboring fragments.
const travelerFrames=[[0,450,'none'],[452,465,'none'],[918,426,'polygon(0 0,100% 0,100% 45%,86.5% 45%,86.5% 100%,0 100%)'],[1280,494,'polygon(13% 32.7%,100% 32.7%,100% 100%,13% 100%,13% 70%,0 70%,0 55%,13% 55%)']];
const phases={opening:[1800,'flight'],descent:[4600,'forest'],forest:[1100,'icons']};
export default function ParachuteHome(){
 const host=useRef(null),launched=useRef(false);
 const [stage,setStage]=useState('wind'),[moving,setMoving]=useState(false),[skipped,setSkipped]=useState(false);
 const reduced=useRef(matchMedia('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{
  const cover=host.current.closest('.cover');
  cover.dataset.homeStage=stage;
  const nav=document.querySelector('.bottom-nav');if(nav&&document.body.classList.contains('home-screen'))nav.hidden=stage!=='icons';
  cover.dataset.soundscape=['forest','icons'].includes(stage)?'forest':'ocean';
  const phase=phases[stage];let visible=false,raf=0,last=0,elapsed=0;
  const tick=now=>{if(!visible||document.hidden)return;if(last)elapsed+=now-last;last=now;if(elapsed>=phase[0]){setStage(phase[1]);return;}raf=requestAnimationFrame(tick)};
  const sync=()=>{cancelAnimationFrame(raf);last=0;const active=visible&&!document.hidden;setMoving(active);if(active&&phase)raf=requestAnimationFrame(tick)};
  const io=new IntersectionObserver(([e])=>{visible=e.isIntersecting;sync()},{threshold:.01});io.observe(host.current);document.addEventListener('visibilitychange',sync);
  return()=>{cancelAnimationFrame(raf);io.disconnect();document.removeEventListener('visibilitychange',sync)};
 },[stage]);
 const canSkip=['flight','descent','forest'].includes(stage);
 const skip=()=>{setSkipped(true);setStage('icons')};
 const launch=()=>{if(launched.current)return;launched.current=true;setStage(reduced.current?'icons':'opening')};
 return <div ref={host} className={`parachute-menu home-story is-${stage} ${moving?'':'is-paused'} ${skipped?'is-skipped':''}`} data-home-stage={stage}>
 {['wind','opening'].includes(stage)&&<WindOpening opening={stage==='opening'} moving={moving} reduced={reduced.current} onOpen={launch}/>}
 {stage==='flight'&&<div className="home-flight"><FlightCollage planeSrc="assets/kumano-aircraft.webp" autoPlay exitUpward onFlightComplete={()=>setStage(current=>current==='flight'?'descent':current)}/></div>}
 {canSkip&&<div className="home-skip-surface" role="button" tabIndex={0} aria-label="跳过开场动画" onClick={skip} onKeyDown={event=>{if(['Enter',' ','Escape'].includes(event.key)){event.preventDefault();skip()}}}><span>轻触屏幕，跳过动画</span></div>}
 <div className="home-arrivals" aria-hidden="true">{links.map(([id],i)=><div key={id} className={`home-actor parachute-link-${i} ${i===3?'is-freefall':''}`} style={{'--home-fall-from':`${2-[57,48,60,41][i]}svh`}}><span className="home-parachute" style={{backgroundSize:`${1774/travelerFrames[i][1]*100}% 100%`,backgroundPosition:`${travelerFrames[i][0]/(1774-travelerFrames[i][1])*100}% 50%`,aspectRatio:`${travelerFrames[i][1]}/887`,clipPath:travelerFrames[i][2]}}/></div>)}</div>
 <h1 className="home-art-title" aria-label="熊野古道">{[[0,555],[555,455],[1010,445],[1455,528]].map(([y,h],i)=><span className="home-title-glyph" key={i} aria-hidden="true" style={{height:`calc(var(--home-title-width) * ${h/793})`,animationDelay:`${i*.38}s`}}><img src="assets/kumano-title-vertical.png" alt="" draggable="false" style={{top:`calc(var(--home-title-width) * ${-y/793})`}}/></span>)}</h1>

 </div>
}
