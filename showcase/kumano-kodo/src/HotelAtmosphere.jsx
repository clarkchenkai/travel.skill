import React, { useEffect, useRef, useState } from 'react';

const LABELS = {
  manpa: '和歌浦岬端海平线的原创空间抽象',
  fujiya: '川汤河石与涌泉的原创空间抽象',
  taoya: '那智湾夕照与暖木格栅的原创空间抽象',
  imperial: '帝国饭店透光玻璃与细金光的原创空间抽象',
  okura: '大仓桧木几何与多面灯的原创空间抽象',
};

function pointFromEvent(event) {
  const box = event.currentTarget.getBoundingClientRect();
  return {
    x: Math.max(8, Math.min(312, ((event.clientX - box.left) / box.width) * 320)),
    y: Math.max(8, Math.min(162, ((event.clientY - box.top) / box.height) * 170)),
  };
}

function MotionDefs({ kind }) {
  return <defs>
    <linearGradient id={`${kind}-sky`} x1="0" y1="0" x2="1" y2="1">
      {kind === 'manpa' && <><stop stopColor="#132f43"/><stop offset=".62" stopColor="#557b91"/><stop offset="1" stopColor="#e9b77f"/></>}
      {kind === 'fujiya' && <><stop stopColor="#15383b"/><stop offset=".5" stopColor="#5d9690"/><stop offset="1" stopColor="#d9dfc4"/></>}
      {kind === 'taoya' && <><stop stopColor="#2e2930"/><stop offset=".55" stopColor="#bd744c"/><stop offset="1" stopColor="#f0c68a"/></>}
      {kind === 'imperial' && <><stop stopColor="#40576a"/><stop offset=".48" stopColor="#d9e0d5"/><stop offset="1" stopColor="#f6cf8e"/></>}
      {kind === 'okura' && <><stop stopColor="#eeeadc"/><stop offset=".7" stopColor="#d4c69e"/><stop offset="1" stopColor="#a97f66"/></>}
    </linearGradient>
    <linearGradient id={`${kind}-water`} x1="0" y1="0" x2="1" y2="0">
      <stop stopColor="#173e48"/><stop offset=".5" stopColor="#4d8c94"/><stop offset="1" stopColor="#d0b26d"/>
    </linearGradient>
    <radialGradient id={`${kind}-glow`}>
      <stop stopColor="#fff5ce" stopOpacity=".94"/><stop offset=".45" stopColor="#f4c779" stopOpacity=".44"/><stop offset="1" stopColor="#f0ae62" stopOpacity="0"/>
    </radialGradient>
    <filter id={`${kind}-soft`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4"/></filter>
    <filter id={`${kind}-grain`}><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" seed="7" result="n"/><feColorMatrix in="n" type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 .065"/></feComponentTransfer></filter>
  </defs>;
}

function TapRings({ point, kind, reduced }) {
  if (!point) return null;
  return <g className={`hotel-atmosphere__tap-rings ${reduced ? 'is-reduced' : ''}`} aria-hidden="true">
    <circle cx={point.x} cy={point.y} r="5" fill={`url(#${kind}-glow)`} />
    <circle cx={point.x} cy={point.y} r="12" />
    <circle cx={point.x} cy={point.y} r="25" />
    <circle cx={point.x} cy={point.y} r="43" />
  </g>;
}

function Manpa({ point, reduced }) {
  return <>
    <rect width="320" height="170" fill="url(#manpa-sky)"/>
    <path d="M0 84C36 78 62 84 98 80s58-9 92-3 67 1 130-9V99H0Z" fill="#e6a36f" opacity=".48"/>
    <path d="M0 95C51 89 94 101 143 95s96 7 177-4v79H0Z" fill="url(#manpa-water)"/>
    <g className="hotel-atmosphere__manpa-water" fill="none" stroke="#d9edf0" strokeOpacity=".55">
      <path d="M0 111c22-5 41 6 64 0s42 6 66 0 41 6 65 0 42 6 70 0"/>
      <path d="M22 129c26-6 42 5 67 0s47 6 75 0 43 5 76-1"/>
      <path d="M80 148c28-5 46 6 74 0s50 6 92-1"/>
    </g>
    <path d="M0 151V116l34-11 41 9 28-19 34 9 22-17 33 8 31-13 29 8 38-20v80Z" fill="#172d35"/>
    <path d="M0 159V142l45-16 46 11 42-21 47 13 39-20 45 14 56-23v70H0Z" fill="#0e222a" opacity=".92"/>
    <path d="M10 147l42-15 17 4 42-19 18 5" fill="none" stroke="#d59d69" strokeWidth="1.2" strokeDasharray="2 5" opacity=".8"/>
    <g className="hotel-atmosphere__deck" transform="translate(238 111)"><path d="M0 13 51 0v30L0 43Z" fill="#6c442e"/><path d="m2 14 49-13M2 24l49-13M2 34l49-13" stroke="#d9a87a" strokeOpacity=".58"/><path d="M6 8v29m17-34v29m17-34v29m17-34v29" stroke="#2a1c17"/></g>
    <circle className="hotel-atmosphere__sun" cx="270" cy="55" r="23" fill="url(#manpa-glow)"/>
    <rect width="320" height="170" filter="url(#manpa-grain)"/>
    <TapRings point={point} kind="manpa" reduced={reduced}/>
  </>;
}

function Fujiya({ point, reduced }) {
  return <>
    <rect width="320" height="170" fill="#153a3d"/>
    <path d="M0 26C33 11 75 30 106 19S170 3 213 19s70-4 107-16V0H0Z" fill="#244b48"/>
    <path d="M0 73c42-11 74 13 118 0s65 8 104-3 55 1 98-8v108H0Z" fill="#285b5a"/>
    <path d="M-13 168C49 132 52 101 101 91c41-9 60 15 93 8 38-8 58-39 139-47v118H-13Z" fill="#a8d2ca"/>
    <path d="M-13 160c57-29 67-53 114-62 39-8 63 16 96 8 36-9 55-37 136-45" fill="none" stroke="#e7f0d5" strokeOpacity=".76" strokeWidth="3"/>
    <g className="hotel-atmosphere__river-lines" fill="none" stroke="#f2f6dc" strokeOpacity=".5">
      <path d="M9 163c56-31 65-47 106-56s53 11 83 2 49-33 107-43"/>
      <path d="M26 170c45-29 70-40 102-47 35-8 50 5 79-6s40-25 78-32"/>
    </g>
    <g fill="#6b8174" stroke="#b8c2a4" strokeWidth=".8"><ellipse cx="27" cy="91" rx="14" ry="8"/><ellipse cx="57" cy="115" rx="19" ry="11"/><ellipse cx="255" cy="119" rx="22" ry="12"/><ellipse cx="281" cy="92" rx="13" ry="8"/><ellipse cx="219" cy="151" rx="17" ry="9"/><ellipse cx="82" cy="151" rx="13" ry="7"/></g>
    <g className="hotel-atmosphere__spring" transform="translate(156 92)"><circle r="31" fill="#d9e7c7" fillOpacity=".13"/><circle r="22" fill="none" stroke="#e5eed2" strokeWidth="1.2"/><circle r="13" fill="none" stroke="#b8e0d8"/><circle r="4" fill="#eff6d8"/></g>
    <rect width="320" height="170" filter="url(#fujiya-grain)"/>
    <TapRings point={point} kind="fujiya" reduced={reduced}/>
  </>;
}

function Taoya({ point, reduced }) {
  return <>
    <rect width="320" height="170" fill="url(#taoya-sky)"/>
    <circle className="hotel-atmosphere__taoya-sun" cx="242" cy="51" r="27" fill="#ffcf89"/>
    <path d="M0 93c44-7 82 5 122-2 44-8 74 9 108 1 34-7 55-5 90-12v90H0Z" fill="#355b67"/>
    <g className="hotel-atmosphere__taoya-water" stroke="#f8d6a5" strokeWidth="1.1" strokeOpacity=".6"><path d="M28 109h210"/><path d="M46 119h184"/><path d="M69 130h137"/><path d="M89 141h100"/></g>
    <path d="M0 86c37-17 61 3 88-8 25-10 34-33 68-31 35 3 44 23 71 17 29-6 49-32 93-21V95H0Z" fill="#302d31"/>
    <path d="M0 126h124l32-23h164v67H0Z" fill="#201d1e"/>
    <g className="hotel-atmosphere__taoya-lattice" transform="translate(164 106)"><rect width="135" height="64" fill="#563829"/><path d="M8 0v64m18-64v64m18-64v64m18-64v64m18-64v64m18-64v64m18-64v64M0 15h135M0 31h135M0 47h135" stroke="#d09a64" strokeWidth="2" opacity=".72"/><path d="M0 4 130 63" stroke="#eec48e" strokeOpacity=".18" strokeWidth="5"/></g>
    <path d="M0 151c38-6 55-1 86-10 26-8 44-3 78-10" fill="none" stroke="#d5a36f" strokeWidth="1.3" strokeDasharray="3 5"/>
    <rect width="320" height="170" filter="url(#taoya-grain)"/>
    <TapRings point={point} kind="taoya" reduced={reduced}/>
  </>;
}

function Imperial({ point, reduced }) {
  const cells = Array.from({ length: 42 }, (_, i) => ({ x: 14 + (i % 7) * 43, y: 12 + Math.floor(i / 7) * 24 }));
  return <>
    <rect width="320" height="170" fill="#263a4a"/>
    <path d="M0 132 67 116l65 11 71-23 117 19v47H0Z" fill="#17252f"/>
    <g className="hotel-atmosphere__imperial-wall">
      {cells.map((cell, index) => <rect key={index} x={cell.x} y={cell.y} width="37" height="19" rx="1.5" fill={index % 4 === 0 ? '#c9d8d3' : index % 3 === 0 ? '#97b5bd' : '#dce3d2'} opacity={.32 + (index % 5) * .08}/>) }
      {cells.map((cell, index) => <rect key={`line-${index}`} x={cell.x} y={cell.y} width="37" height="19" rx="1.5" fill="none" stroke="#fbf0c8" strokeOpacity=".35"/>) }
    </g>
    <path className="hotel-atmosphere__imperial-gold" d="M0 111C53 90 87 120 135 98s73 4 104-12 47-4 81-21" fill="none" stroke="#edc271" strokeWidth="1.3"/>
    <path d="M0 138h320" stroke="#d9b877" strokeOpacity=".6"/>
    <g className="hotel-atmosphere__imperial-steps"><path d="M55 170v-13h209v13M76 157v-12h164v12M98 145v-11h121v11" fill="#334654" stroke="#7b8d91" strokeWidth=".8"/></g>
    {point && <g className={`hotel-atmosphere__imperial-touch ${reduced ? 'is-reduced' : ''}`}><circle cx={point.x} cy={point.y} r="9"/><circle cx={point.x} cy={point.y} r="42"/><circle cx={point.x} cy={point.y} r="78"/></g>}
    <rect width="320" height="170" filter="url(#imperial-grain)"/>
    <TapRings point={point} kind="imperial" reduced={reduced}/>
  </>;
}

function Okura({ point, reduced }) {
  const lattice = Array.from({ length: 9 }, (_, i) => 18 + i * 35);
  return <>
    <rect width="320" height="170" fill="url(#okura-sky)"/>
    <rect x="0" y="0" width="320" height="170" fill="#f3efe2" fillOpacity=".62"/>
    <g className="hotel-atmosphere__okura-lattice" fill="none" stroke="#9e8661" strokeWidth="1.1" strokeOpacity=".65">
      {lattice.map((x) => <path key={x} d={`M${x} 0l17.5 30L${x} 60l17.5 30L${x} 120l17.5 30L${x} 170M${x + 35} 0l-17.5 30L${x + 35} 60l-17.5 30L${x + 35} 120l-17.5 30L${x + 35} 170`}/>) }
    </g>
    <path d="M0 131c54-9 81 5 132-6s80 8 188-7v52H0Z" fill="#e8dfc9"/>
    <path d="M0 147h320" stroke="#725d49" strokeOpacity=".42"/>
    <g className="hotel-atmosphere__okura-lantern" transform="translate(238 23)"><path d="m0 0 13 8v17l-13 8-13-8V8Z" fill="#29221f" stroke="#a54634"/><path d="m0 5 8 5v10l-8 5-8-5V10Z" fill="#f2ca7c" opacity=".83"/><path d="M0 33v21m-21-54 9 6v17l-9 6m42-29-9 6v17l9 6" stroke="#9a7c55" fill="none"/><path d="m-21 0 9 6v17l-9 6m42-29-9 6v17l9 6" fill="#342925" stroke="#a54634"/></g>
    <g className="hotel-atmosphere__okura-table" transform="translate(87 125)"><ellipse rx="27" ry="10" fill="#211b18"/><ellipse rx="20" ry="6" fill="#8e2d28" opacity=".82"/><circle cx="0" cy="-17" r="5" fill="#211b18"/><circle cx="20" cy="-5" r="5" fill="#211b18"/><circle cx="12" cy="13" r="5" fill="#211b18"/><circle cx="-12" cy="13" r="5" fill="#211b18"/><circle cx="-20" cy="-5" r="5" fill="#211b18"/></g>
    {point && <g className={`hotel-atmosphere__okura-touch ${reduced ? 'is-reduced' : ''}`}><path d={`M${point.x} ${point.y} L238 39`} /><circle cx={point.x} cy={point.y} r="18"/></g>}
    <rect width="320" height="170" filter="url(#okura-grain)"/>
    <TapRings point={point} kind="okura" reduced={reduced}/>
  </>;
}

function Scene({ kind, point, reduced }) {
  if (kind === 'fujiya') return <Fujiya point={point} reduced={reduced}/>;
  if (kind === 'taoya') return <Taoya point={point} reduced={reduced}/>;
  if (kind === 'imperial') return <Imperial point={point} reduced={reduced}/>;
  if (kind === 'okura') return <Okura point={point} reduced={reduced}/>;
  return <Manpa point={point} reduced={reduced}/>;
}

export default function HotelAtmosphere({ kind = 'manpa' }) {
  const safeKind = LABELS[kind] ? kind : 'manpa';
  const hostRef = useRef(null);
  const timerRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [point, setPoint] = useState(null);
  const [response, setResponse] = useState(0);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener?.('change', sync);
    return () => query.removeEventListener?.('change', sync);
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !('IntersectionObserver' in window)) {
      setVisible(true);
      setEntered(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
      if (entry.isIntersecting) setEntered(true);
    }, { threshold: 0.18 });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  function reactToTap(event) {
    if (event.button && event.button !== 0) return;
    setPoint(pointFromEvent(event));
    setResponse((value) => value + 1);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setPoint(null), reduced ? 1000 : 1500);
  }

  return <figure
    ref={hostRef}
    className={`hotel-atmosphere hotel-atmosphere--${safeKind} ${visible ? 'is-visible' : 'is-paused'} ${entered ? 'has-entered' : ''} ${reduced ? 'prefers-reduced-motion' : ''}`}
    aria-label={LABELS[safeKind]}
  >
    <svg viewBox="0 0 320 170" role="img" aria-label={LABELS[safeKind]} onPointerDown={reactToTap} style={{ '--reaction': response }}>
      <MotionDefs kind={safeKind}/>
      <Scene kind={safeKind} point={point} reduced={reduced}/>
    </svg>
    <figcaption aria-live="polite" className="hotel-atmosphere__sr-only">{point ? '已显示空间的触碰反馈' : '点按画面可查看材质互动'}</figcaption>
    <style>{`
      .hotel-atmosphere{position:relative;width:min(100%,280px);height:150px;margin:0;overflow:hidden;border-radius:18px;background:#18313b;isolation:isolate;touch-action:manipulation;box-shadow:0 13px 24px rgba(18,35,36,.16)}
      .hotel-atmosphere svg{display:block;width:100%;height:100%;cursor:pointer;outline:none;transform:scale(1.02);transition:transform .65s cubic-bezier(.2,.8,.2,1),filter .5s ease}
      .hotel-atmosphere:not(.has-entered) svg{opacity:.02;transform:scale(1.07);filter:blur(4px)}
      .hotel-atmosphere.is-paused svg *{animation-play-state:paused!important}
      .hotel-atmosphere__sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
      .hotel-atmosphere__tap-rings circle{fill:none;stroke:#fbf1cb;stroke-width:1.25;transform-box:fill-box;transform-origin:center;animation:hotel-atmosphere-ring .92s ease-out both}
      .hotel-atmosphere__tap-rings circle:nth-child(1){stroke:none;animation:hotel-atmosphere-flash .5s ease-out both}.hotel-atmosphere__tap-rings circle:nth-child(2){animation-delay:0s}.hotel-atmosphere__tap-rings circle:nth-child(3){animation-delay:.08s}.hotel-atmosphere__tap-rings circle:nth-child(4){animation-delay:.16s}
      .hotel-atmosphere__tap-rings.is-reduced circle{animation:none;opacity:.64}.hotel-atmosphere__tap-rings.is-reduced circle:nth-child(n+3){opacity:.18}
      @keyframes hotel-atmosphere-ring{from{opacity:.95;transform:scale(.15)}to{opacity:0;transform:scale(1.55)}}@keyframes hotel-atmosphere-flash{from{opacity:1;transform:scale(.6)}to{opacity:0;transform:scale(3)}}
      .hotel-atmosphere__manpa-water path{animation:hotel-atmosphere-drift 5.2s ease-in-out infinite alternate}.hotel-atmosphere__manpa-water path:nth-child(2){animation-delay:-2.1s}.hotel-atmosphere__deck{transform-origin:273px 133px;animation:hotel-atmosphere-deck-glow 4s ease-in-out infinite}.hotel-atmosphere__sun{animation:hotel-atmosphere-breathe 5.6s ease-in-out infinite}
      .hotel-atmosphere__river-lines path{animation:hotel-atmosphere-river 4.4s ease-in-out infinite alternate}.hotel-atmosphere__river-lines path:nth-child(2){animation-delay:-1.7s}.hotel-atmosphere__spring{transform-origin:156px 92px;animation:hotel-atmosphere-spring 4.8s ease-in-out infinite}
      .hotel-atmosphere__taoya-sun{animation:hotel-atmosphere-breathe 5s ease-in-out infinite}.hotel-atmosphere__taoya-water{animation:hotel-atmosphere-water-shine 4s ease-in-out infinite}.hotel-atmosphere__taoya-lattice{transform-origin:232px 138px;animation:hotel-atmosphere-lattice-light 5.4s ease-in-out infinite}
      .hotel-atmosphere__imperial-wall rect{animation:hotel-atmosphere-glass 5.6s ease-in-out infinite}.hotel-atmosphere__imperial-wall rect:nth-child(3n){animation-delay:-1.4s}.hotel-atmosphere__imperial-gold{animation:hotel-atmosphere-gold 4.8s ease-in-out infinite}
      .hotel-atmosphere__imperial-touch circle{fill:none;stroke:#fff4c9;stroke-width:1.4;animation:hotel-atmosphere-glass-spread .82s ease-out both}.hotel-atmosphere__imperial-touch circle:nth-child(2){animation-delay:.08s}.hotel-atmosphere__imperial-touch circle:nth-child(3){animation-delay:.16s}.hotel-atmosphere__imperial-touch.is-reduced circle{animation:none;opacity:.42}.hotel-atmosphere__imperial-touch.is-reduced circle:last-child{opacity:.12}
      .hotel-atmosphere__okura-lattice{animation:hotel-atmosphere-lattice-light 6s ease-in-out infinite}.hotel-atmosphere__okura-lantern{transform-origin:238px 23px;animation:hotel-atmosphere-lantern 5.5s ease-in-out infinite}.hotel-atmosphere__okura-table{animation:hotel-atmosphere-table 6.4s ease-in-out infinite}
      .hotel-atmosphere__okura-touch path{stroke:#f4d286;stroke-width:1.2;stroke-dasharray:3 5;animation:hotel-atmosphere-refraction .7s ease-out both}.hotel-atmosphere__okura-touch circle{fill:#f5ca75;fill-opacity:.15;stroke:#a64432;stroke-width:1.1;animation:hotel-atmosphere-flash .7s ease-out both}.hotel-atmosphere__okura-touch.is-reduced path,.hotel-atmosphere__okura-touch.is-reduced circle{animation:none;opacity:.65}
      @keyframes hotel-atmosphere-drift{to{transform:translateX(7px)}}@keyframes hotel-atmosphere-deck-glow{0%,100%{filter:brightness(.92)}50%{filter:brightness(1.18)}}@keyframes hotel-atmosphere-breathe{50%{opacity:.78;filter:brightness(1.16)}}@keyframes hotel-atmosphere-river{to{transform:translateX(9px);opacity:.78}}@keyframes hotel-atmosphere-spring{50%{transform:scale(1.075);opacity:.7}}@keyframes hotel-atmosphere-water-shine{50%{transform:translateX(-5px);opacity:.88}}@keyframes hotel-atmosphere-lattice-light{50%{opacity:.62;filter:brightness(1.18)}}@keyframes hotel-atmosphere-glass{50%{opacity:.84;filter:brightness(1.22)}}@keyframes hotel-atmosphere-glass-spread{from{opacity:.94;transform:scale(.1)}to{opacity:0;transform:scale(1.1)}}@keyframes hotel-atmosphere-gold{50%{stroke-width:2.2;opacity:.92}}@keyframes hotel-atmosphere-lantern{0%,100%{transform:rotate(-1deg)}50%{transform:rotate(1.4deg)}}@keyframes hotel-atmosphere-table{50%{opacity:.84;transform:translateY(-1px)}}@keyframes hotel-atmosphere-refraction{from{stroke-dashoffset:28;opacity:1}to{stroke-dashoffset:0;opacity:0}}
      .hotel-atmosphere.prefers-reduced-motion svg,.hotel-atmosphere.prefers-reduced-motion svg *{animation:none!important;transition:none!important}.hotel-atmosphere.prefers-reduced-motion:not(.has-entered) svg{opacity:1;transform:none;filter:none}
      .hotel-atmosphere:focus-within,.hotel-atmosphere svg:focus-visible{outline:3px solid #ddbf7e;outline-offset:3px}
    `}</style>
  </figure>;
}
