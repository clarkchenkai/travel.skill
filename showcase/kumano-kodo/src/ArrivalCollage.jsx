import React,{useEffect,useRef,useState} from 'react';
export const fieldObjects=[['route','地图'],['itinerary','日程'],['transport','交通'],['prep','行囊']];
export function FieldObjects({className='',compact=false,linkBase=''}){return <nav className={`field-objects ${className} ${compact?'compact':''}`} aria-label="四枚行旅向导">{fieldObjects.map(([id,label],i)=><a key={id} href={`${linkBase}#${id}`} data-object={id}><span className="field-object-image" style={{backgroundPosition:`${i*100/3}% 50%`}} aria-hidden="true"/><span>{label}</span></a>)}</nav>}
export default function ArrivalCollage({playKey=0,onComplete,linkBase=''}){
 const host=useRef(null),nodes=useRef([]),callback=useRef(onComplete);callback.current=onComplete;
 const [landed,setLanded]=useState(false);
 useEffect(()=>{let active=true,visible=false;let timer;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let animations=[];setLanded(reduced);
  if(reduced){callback.current?.();return;}
  animations=nodes.current.filter(Boolean).map((node,i)=>node.animate([{transform:`translate3d(${-8+i*4}px,-145px,0) rotate(${-4+i*2}deg)`,opacity:0},{transform:`translate3d(${6-i*3}px,35px,0) rotate(${3-i}deg)`,opacity:1,offset:.42},{transform:`translate3d(0,130px,0) rotate(0deg)`,opacity:1}],{duration:5300+i*180,delay:i*420,fill:'forwards',easing:'cubic-bezier(.2,.5,.2,1)'}));
  animations.forEach(a=>a.pause());
  const sync=()=>animations.forEach(a=>{if(a.playState==='finished')return;if(visible&&!document.hidden)a.play();else a.pause()});
  const io=new IntersectionObserver(([e])=>{visible=e.isIntersecting;sync()},{threshold:.05});io.observe(host.current);document.addEventListener('visibilitychange',sync);
  Promise.all(animations.map(a=>a.finished.catch(()=>null))).then(()=>{if(!active)return;setLanded(true);timer=setTimeout(()=>{if(!active)return;callback.current?.();document.dispatchEvent(new CustomEvent('journey:arrived',{detail:{targets:fieldObjects.map(x=>x[0])}}))},850)});
  return()=>{active=false;clearTimeout(timer);io.disconnect();document.removeEventListener('visibilitychange',sync);animations.forEach(a=>a.cancel())};
 },[playKey]);
 return <div className={`arrival-collage ${landed?'has-arrived':''}`} ref={host} data-arrival-state={landed?'landed':'descending'}>
  <div className="parachute-layer" aria-label="四位旅人徐徐降落">{fieldObjects.map(([id],i)=><div key={id} className="traveler-sprite" ref={e=>nodes.current[i]=e} style={{left:`${2+i*24}%`,backgroundPosition:`${i*100/3}% 50%`}}/>)}</div>
  <div className="arrival-field-objects"><p>关西落地，山海启程。</p><FieldObjects linkBase={linkBase}/></div>
 </div>
}
