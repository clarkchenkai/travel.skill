import React, { useEffect, useRef, useState } from 'react';

const travelers = [79, 144, 212, 281];
const guides = [
  { target: 'route', label: '地图', icon: 'map' },
  { target: 'itinerary', label: '日程', icon: 'steps' },
  { target: 'transport', label: '交通', icon: 'ticket' },
  { target: 'prep', label: '背包', icon: 'pack' },
];
const sizes = [1, .88, 1.08, .94];
const validVariant = variant => ['leaves', 'waypoints', 'trail'].includes(variant) ? variant : 'leaves';
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

const styles = `
 .arrival-scene{position:relative;min-height:292px;overflow:hidden;border-radius:18px;background:#17372c;color:#f4f1e8;isolation:isolate}.arrival-scene:before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 74% 15%,#406a7c92,transparent 47%),linear-gradient(164deg,#f4f1e80c 0 38%,transparent 65%)}
 .arrival-scene__title{position:absolute;top:17px;left:18px;z-index:3;margin:0;font:650 10px/1.25 ui-monospace,SFMono-Regular,monospace;letter-spacing:.14em;color:#c9d6c7}.arrival-scene__svg{display:block;width:100%;height:292px;touch-action:pan-y}.arrival-scene__sky-line{stroke:#f4f1e84d;stroke-width:1;stroke-dasharray:2 7}.arrival-scene__water{fill:#406a7c}.arrival-scene__shore{fill:#d8c7a3}.arrival-scene__island{fill:#d4d0bb}.arrival-scene__runway{fill:#778c8b;stroke:#f4f1e87a;stroke-width:1}.arrival-scene__runway-mark{stroke:#f4f1e8c7;stroke-width:1.25;stroke-dasharray:7 6}.arrival-scene__contour{fill:none;stroke:#b88b4857;stroke-width:1;stroke-dasharray:2 5}
 .arrival-scene__traveler{transform-box:fill-box;transform-origin:center}.arrival-scene__canopy{fill:#f4f1e8;stroke:#b88b48;stroke-width:1.4}.arrival-scene__cord{stroke:#f4f1e8a8;stroke-width:.8}.arrival-scene__body{stroke:#f4f1e8;stroke-width:1.9;stroke-linecap:round}.arrival-scene__sprig,.arrival-scene__token,.arrival-scene__trail-foot{opacity:0;transition:opacity .55s ease,transform .55s cubic-bezier(.2,.7,.2,1);transform-box:fill-box;transform-origin:center}
 .arrival-scene__traveler.is-landed .arrival-scene__canopy,.arrival-scene__traveler.is-landed .arrival-scene__cord,.arrival-scene__traveler.is-landed .arrival-scene__body{opacity:0;transform:scale(.58)}.arrival-scene__traveler.is-landed .arrival-scene__sprig,.arrival-scene__traveler.is-landed .arrival-scene__token,.arrival-scene__traveler.is-landed .arrival-scene__trail-foot{opacity:1;transform:scale(1)}
 .arrival-scene__sprig-stem{stroke:#b88b48;stroke-width:1.5;stroke-linecap:round}.arrival-scene__needle{stroke:#9db889;stroke-width:1.35;stroke-linecap:round}.arrival-scene__token-ring{fill:#17372c;stroke:#b88b48;stroke-width:1.5}.arrival-scene__token-mark{fill:none;stroke:#f4f1e8;stroke-width:1.35;stroke-linecap:round;stroke-linejoin:round}.arrival-scene__token-label{fill:#dce4d3;font:650 7px/1 ui-monospace,SFMono-Regular,monospace;letter-spacing:.08em}.arrival-scene__token-link{cursor:pointer}.arrival-scene__token-link:focus .arrival-scene__token-ring,.arrival-scene__token-link:hover .arrival-scene__token-ring{fill:#b88b48;stroke:#f4f1e8}.arrival-scene__trail{fill:none;stroke:#d7dec5;stroke-width:1.2;stroke-dasharray:2 5}.arrival-scene__caption{position:absolute;left:18px;bottom:15px;z-index:3;margin:0;font:650 14px/1.3 system-ui,sans-serif}.arrival-scene__caption small{display:block;margin-top:3px;font:400 10px/1.4 ui-monospace,SFMono-Regular,monospace;letter-spacing:.07em;color:#c3d1c5}
 .arrival-scene__controls{position:absolute;right:10px;top:10px;z-index:4;display:flex;gap:4px}.arrival-scene__controls button{min-width:44px;min-height:44px;padding:0 9px;border:1px solid #f4f1e842;border-radius:999px;background:#17372ccc;color:#f4f1e8;font:650 11px/1 system-ui,sans-serif}.arrival-scene__controls button:focus-visible{outline:2px solid #b88b48;outline-offset:2px}@media (prefers-reduced-motion:reduce){.arrival-scene__controls{display:none}.arrival-scene__sprig,.arrival-scene__token,.arrival-scene__trail-foot{transition:none}}
`;

function CedarSprig() {
  const needles = [[-5,-11,-13,-16],[-2,-7,7,-15],[3,-3,14,-10],[-4,1,-15,-5],[1,5,13,-1],[-2,10,-11,5]];
  return <g className="arrival-scene__sprig" aria-hidden="true"><path className="arrival-scene__sprig-stem" d="M0 17V-19"/>{needles.map((line, index) => <path key={index} className="arrival-scene__needle" d={`M${line[0]} ${line[1]}L${line[2]} ${line[3]}`}/>)}</g>;
}

function TokenMark({ icon }) {
  if (icon === 'map') return <><path className="arrival-scene__token-mark" d="M-10-8-3-11 4-8 11-11v17L4 9-3 6-10 9Z"/><path className="arrival-scene__token-mark" d="M-3-11V6M4-8V9"/></>;
  if (icon === 'steps') return <><path className="arrival-scene__token-mark" d="M-10 7C-5-5-1 7 4-5S10-2 11-10"/><ellipse cx="-5" cy="1" rx="2" ry="3" fill="#f4f1e8" transform="rotate(-24 -5 1)"/><ellipse cx="4" cy="-4" rx="2" ry="3" fill="#f4f1e8" transform="rotate(24 4 -4)"/></>;
  if (icon === 'ticket') return <><path className="arrival-scene__token-mark" d="M-11-7H11V7H-11Z"/><path className="arrival-scene__token-mark" d="M-4-7V7M1-2H7M1 2H5"/></>;
  return <><path className="arrival-scene__token-mark" d="M-7 9V-5Q0-11 7-5V9Z"/><path className="arrival-scene__token-mark" d="M-4-5V-9Q0-13 4-9V-5M-7 0H7M-3 3H3"/></>;
}

function GuideToken({ guide }) {
  return <a className="arrival-scene__token arrival-scene__token-link" href={`#${guide.target}`} aria-label={`打开${guide.label}`}>
    <circle className="arrival-scene__token-ring" r="16"/><TokenMark icon={guide.icon}/><text className="arrival-scene__token-label" y="27" textAnchor="middle">{guide.label}</text>
  </a>;
}

function Traveler({ x, index, landed, variant, nodeRef }) {
  const guide = guides[index];
  return <g ref={nodeRef} className={`arrival-scene__traveler ${landed ? 'is-landed' : ''}`} transform={`translate(${x} 210)`}>
    <path className="arrival-scene__canopy" d="M-20 0Q0-24 20 0Q0 9-20 0Z"/>
    <path className="arrival-scene__cord" d="M-16 1-4 29M16 1 4 29M-5 0-2 29M5 0 2 29"/>
    <path className="arrival-scene__body" d="M0 29v11m0-6-7 7m7-7 7 7m-7-3-5 10m5-10 5 10"/>
    {variant === 'leaves' && <CedarSprig/>}{variant === 'waypoints' && <GuideToken guide={guide}/>} 
    {variant === 'trail' && <g className="arrival-scene__trail-foot" aria-hidden="true"><ellipse cx="-3" cy="4" rx="2.1" ry="4" fill="#d7dec5" transform="rotate(-25)"/><ellipse cx="5" cy="-5" rx="2.1" ry="4" fill="#d7dec5" transform="rotate(25)"/></g>}
  </g>;
}

/** Four companions arrive at KIX and become travel guides, cedar sprigs, or a trail imprint. */
export default function ArrivalScene({ variant = 'leaves', playKey = 0, onComplete, showControls = false }) {
  const hostRef = useRef(null);
  const viewableRef = useRef(false);
  const nodes = useRef([]); const callbackRef = useRef(onComplete); const animationsRef = useRef([]); const runRef = useRef(0);
  const [landed, setLanded] = useState(false); const [paused, setPaused] = useState(false); const [localRun, setLocalRun] = useState(0);
  const selected = validVariant(variant); callbackRef.current = onComplete;
  const finish = detail => { document.dispatchEvent(new CustomEvent('journey:arrived', { detail: { targets: guides.map(guide => guide.target), ...detail } })); callbackRef.current?.(detail); };

  useEffect(() => {
    const run = ++runRef.current; let completeTimer = 0; const staticEnd = reduceMotion();
    animationsRef.current.forEach(animation => animation.cancel()); animationsRef.current = []; setPaused(false); setLanded(staticEnd);
    if (staticEnd) { finish({ variant: selected, reducedMotion: true }); return undefined; }
    const animations = nodes.current.filter(Boolean).map((node, index) => node.animate([
      { transform: `translate(${travelers[index]}px -112px) rotate(${-7 + index * 4}deg) scale(${sizes[index]})`, opacity: .12 },
      { transform: `translate(${travelers[index]}px 227px) rotate(${4 - index * 2}deg) scale(${sizes[index]})`, opacity: 1, offset: .77 },
      { transform: `translate(${travelers[index]}px 210px) rotate(0deg) scale(${sizes[index]})`, opacity: 1 },
    ], { duration: 4050, delay: index * 405, easing: 'cubic-bezier(.18,.72,.24,1)', fill: 'forwards' }));
    animationsRef.current = animations;
    if (!viewableRef.current || document.hidden) animations.forEach(animation => animation.pause());
    Promise.all(animations.map(animation => animation.finished.catch(() => null))).then(() => { if (run !== runRef.current) return; setLanded(true); completeTimer = window.setTimeout(() => { if (run === runRef.current) finish({ variant: selected }); }, 540); });
    return () => { window.clearTimeout(completeTimer); animations.forEach(animation => animation.cancel()); if (runRef.current === run) runRef.current += 1; };
  }, [playKey, localRun, selected]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const pause = () => { animationsRef.current.forEach(animation => animation.pause()); };
    const resume = () => { if (!document.hidden) animationsRef.current.forEach(animation => animation.play()); };
    const observer = new IntersectionObserver(entries => { viewableRef.current = entries[0]?.isIntersecting === true; if (viewableRef.current) resume(); else pause(); }, { threshold: .05 });
    observer.observe(host);
    const visibility = () => { if (document.hidden) pause(); else resume(); };
    document.addEventListener('visibilitychange', visibility);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); };
  }, []);

  const pause = () => { animationsRef.current.forEach(animation => animation.pause()); setPaused(true); };
  const resume = () => { animationsRef.current.forEach(animation => animation.play()); setPaused(false); };
  const skip = () => { runRef.current += 1; animationsRef.current.forEach(animation => animation.cancel()); setLanded(true); setPaused(false); finish({ variant: selected, skipped: true }); };

  return <section ref={hostRef} className={`arrival-scene arrival-scene--${selected}`} aria-label="四位同行人抵达关西的旅程转场">
    <style>{styles}</style><p className="arrival-scene__title">KIX · FOUR ARRIVE</p>
    <svg className="arrival-scene__svg" viewBox="0 0 360 292" aria-label="四位同行人降落在关西海上人工岛，开始熊野之旅">
      <path className="arrival-scene__sky-line" d="M22 69H338M41 121H319"/><path className="arrival-scene__water" d="M0 188C54 178 93 196 143 187S245 174 360 190V292H0Z"/>
      <path className="arrival-scene__shore" d="M0 244C43 235 80 252 119 242S208 233 255 242S318 236 360 245V292H0Z"/><path className="arrival-scene__island" d="M24 241C97 226 182 226 334 238L342 253C210 262 104 261 18 253Z"/>
      <path className="arrival-scene__runway" d="M47 241L305 235 315 245 57 251Z"/><path className="arrival-scene__runway-mark" d="M69 246L285 240"/>
      <path className="arrival-scene__contour" d="M9 174C64 151 99 170 144 153S231 157 281 133S333 143 356 125M15 160C64 136 105 153 150 135S238 142 284 117"/>
      {selected === 'trail' && <path className={`arrival-scene__trail ${landed ? 'is-landed' : ''}`} d="M54 264C94 239 121 268 153 246S216 259 249 233S294 249 321 218"/>}
      {travelers.map((x, index) => <Traveler key={x} x={x} index={index} landed={landed} variant={selected} nodeRef={node => { nodes.current[index] = node; }}/>) }
    </svg>
    <p className="arrival-scene__caption">关西 · 旅程从这里开始<small>{selected === 'waypoints' ? '地图 · 日程 · 交通 · 背包' : selected === 'leaves' ? '四枝杉针，四人同行' : '四道脚印，进入熊野'}</small></p>
    {showControls && <div className="arrival-scene__controls" aria-label="抵达转场控制">{!landed && <button type="button" onClick={paused ? resume : pause}>{paused ? '继续' : '暂停'}</button>}{!landed && <button type="button" onClick={skip}>跳过</button>}{landed && <button type="button" onClick={() => setLocalRun(value => value + 1)}>重播</button>}</div>}
  </section>;
}
