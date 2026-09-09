import React,{useEffect,useState,useRef} from 'react';
import {createRoot} from 'react-dom/client';
import JourneyFilm from './JourneyFilm.jsx';
import ParachuteHome from './ParachuteHome.jsx';
import Soundscape from './Soundscape.jsx';
import LivingLandscape from './LivingLandscape.jsx';
function useVisible(host){const [visible,setVisible]=useState(false);useEffect(()=>{let onScreen=false;const sync=()=>setVisible(onScreen&&!document.hidden);const io=new IntersectionObserver(([e])=>{onScreen=e.isIntersecting;sync()},{threshold:.06});if(host.current)io.observe(host.current);document.addEventListener('visibilitychange',sync);return()=>{io.disconnect();document.removeEventListener('visibilitychange',sync)}},[]);return visible}
function JourneyStory({returning=false}){return <JourneyFilm returning={returning}/>;}

function LayeredForest({className=''}){const host=useRef(null),visible=useVisible(host);return <div ref={host} className={`layered-forest ${className}`} data-soundscape="forest"><LivingLandscape kind="forest" src="assets/forest-cover.webp" alt="杉林与石阶"/><img className="forest-near-layer" style={{animationPlayState:visible?'running':'paused'}} src="assets/forest-foreground.webp" alt=""/></div>}
const roots=new Map();
function mount(el,element){if(!el||roots.has(el))return;const root=createRoot(el);roots.set(el,root);root.render(element)}
export function initVisuals(){
 mount(document.querySelector('#sound-control'),<Soundscape/>);
 mount(document.querySelector('[data-parachute-navigation]'),<ParachuteHome/>);
 document.querySelectorAll('[data-living-landscape]').forEach(el=>mount(el,el.dataset.livingLandscape==='forest'&&!el.classList.contains('day-image')?<LayeredForest/>:<LivingLandscape kind={el.dataset.livingLandscape} src={el.dataset.image} alt={el.dataset.alt||'山林风景'}/>));
 document.querySelectorAll('[data-flight-story]').forEach(el=>mount(el,<JourneyStory returning={el.dataset.flightStory==='return'}/>));
 return()=>{roots.forEach(root=>root.unmount());roots.clear()};
}
