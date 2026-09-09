import React,{useRef,useState} from 'react';

export default function WindOpening({opening,moving,reduced,onOpen}){
 const drag=useRef(null),[distance,setDistance]=useState(0),[mistReady,setMistReady]=useState(false),[leafReady,setLeafReady]=useState(false),[backdropSrc,setBackdropSrc]=useState('');
 const ready=mistReady&&leafReady;
 const decoded=(event,setReady)=>{event.currentTarget.decode().catch(()=>{}).then(()=>setReady(true))};
 const finish=event=>{if(!drag.current)return;const travel=drag.current.y-event.clientY;drag.current=null;event.currentTarget.releasePointerCapture?.(event.pointerId);if(travel>=36)onOpen();else setDistance(0)};
 return <div className={`home-wind-scene ${ready?'is-ready':''} ${opening?'is-opening':''} ${drag.current?'is-dragging':''}`}
  style={{'--wind-drag':`${distance}px`}} onPointerDown={event=>{if(!ready||opening)return;drag.current={y:event.clientY};event.currentTarget.setPointerCapture(event.pointerId)}}
  onPointerMove={event=>{if(drag.current)setDistance(Math.max(0,Math.min(120,drag.current.y-event.clientY)))}}
  onPointerUp={finish} onPointerCancel={()=>{drag.current=null;setDistance(0)}}>
  <picture>
   <source media="(min-width:900px) and (min-aspect-ratio:8/5)" srcSet="assets/home-dawn-mist-desktop-1920.webp 1920w, assets/home-dawn-mist-desktop-3840.webp 3840w" sizes="100vw"/>
   <source media="(min-width:900px)" srcSet="assets/home-dawn-mist-portrait-1600.webp 1600w, assets/home-dawn-mist-portrait-2560.webp 2560w" sizes="100vw"/>
   <img className="home-wind-backdrop" src="assets/home-dawn-mist.webp" alt="晨光中的薄雾" fetchPriority="high" draggable="false" onLoad={event=>{setBackdropSrc(event.currentTarget.currentSrc);decoded(event,setMistReady)}}/>
  </picture>
  <span className="home-wind-curtain home-wind-curtain-left" style={backdropSrc?{backgroundImage:`url("${backdropSrc}")`}:undefined} aria-hidden="true"/>
  <span className="home-wind-curtain home-wind-curtain-right" style={backdropSrc?{backgroundImage:`url("${backdropSrc}")`}:undefined} aria-hidden="true"/>
  <button type="button" className="home-wind-leaf" aria-label="向上轻划，借一阵风出发" disabled={!ready||opening} onClick={event=>{if(event.detail===0)onOpen()}}>
   <img src="assets/home-cedar-leaf.webp" alt="一片杉叶" draggable="false" onLoad={event=>decoded(event,setLeafReady)} style={{animationPlayState:ready&&moving&&!opening&&!drag.current&&!reduced?'running':'paused'}}/>
  </button>
  <span className="home-wind-hint">向上轻划，出发</span>
 </div>
}
