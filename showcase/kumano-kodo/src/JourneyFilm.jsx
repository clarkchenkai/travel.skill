import React, { useEffect, useRef, useState } from 'react';
import FlightCollage from './FlightCollage.jsx';

const assets = {
  coast: new URL('../assets/coastal-sky.webp', import.meta.url).href,
  travelers: new URL('../assets/four-travelers.webp', import.meta.url).href,
  cloud: new URL('../assets/cloud-veil.webp', import.meta.url).href,
  aircraft: new URL('../assets/kumano-aircraft.webp', import.meta.url).href,
};

const styles = `
 .journey-film{--mist-alpha:0;position:relative;width:min(100%,390px);height:clamp(500px,138vw,540px);overflow:hidden;background:#183d43;color:#f4f1e8;isolation:isolate}.journey-film *{box-sizing:border-box}.journey-film__layer{position:absolute;inset:0;background-position:center;background-size:cover}.journey-film__coast{background-image:linear-gradient(#183d4315,#183d4360),var(--coast);opacity:1;transform:scale(1.03)}.journey-film__flight{position:absolute;inset:0;z-index:3;opacity:1;transition:opacity 1.2s ease}.journey-film__flight.is-gone{opacity:0;pointer-events:none}.journey-film__flight .flight-collage{width:100%;height:100%;min-height:0!important;background:transparent}.journey-film__flight .flight-collage__canvas{width:100%;height:100%}
 .journey-film__copy{position:absolute;z-index:8;left:24px;top:30px;margin:0;white-space:pre-line;font:650 clamp(26px,7vw,31px)/1.08 var(--handwriting);letter-spacing:-.055em;text-shadow:0 1px 16px #17372c5c}.journey-film__place{position:absolute;z-index:8;left:25px;top:104px;margin:0;font:600 10px/1.3 var(--handwriting);letter-spacing:.12em;color:#f4f1e8c7}.journey-film__arrival{position:absolute;inset:0;z-index:5;pointer-events:none}.journey-film__traveler{position:absolute;width:25%;aspect-ratio:.72;background-image:var(--travelers);background-size:400% 100%;background-repeat:no-repeat;opacity:0;filter:drop-shadow(0 12px 12px #10292261);will-change:transform,opacity}.journey-film__traveler:nth-child(1){left:6%;bottom:20%;background-position:0 0;--land:29%;--depth:.83;--delay:0ms}.journey-film__traveler:nth-child(2){left:25%;bottom:28%;background-position:33.333% 0;--land:41%;--depth:1;--delay:430ms}.journey-film__traveler:nth-child(3){left:50%;bottom:18%;background-position:66.666% 0;--land:25%;--depth:.74;--delay:810ms}.journey-film__traveler:nth-child(4){left:69%;bottom:34%;background-position:100% 0;--land:47%;--depth:.94;--delay:1190ms}.journey-film.is-arrival .journey-film__traveler{animation:journey-fall 6.6s cubic-bezier(.18,.72,.22,1) var(--delay) both}.journey-film.is-landed .journey-film__traveler,.journey-film.is-fade .journey-film__traveler{opacity:0;transform:translateY(var(--land)) scale(var(--depth))}.journey-film__mist{z-index:7;background-image:var(--cloud);background-size:cover;background-position:center;opacity:var(--mist-alpha);mix-blend-mode:screen;pointer-events:none}
 @keyframes journey-fall{0%{opacity:0;transform:translateY(-145%) scale(calc(var(--depth)*.76)) rotate(-5deg)}13%{opacity:1}72%{opacity:1;transform:translateY(calc(var(--land) + 4%)) scale(var(--depth)) rotate(3deg)}100%{opacity:1;transform:translateY(var(--land)) scale(var(--depth)) rotate(0)}}@media (prefers-reduced-motion:reduce){.journey-film__traveler,.journey-film__trails{animation:none!important;transition:none!important}}
`;

const phaseFor = (seconds, returning) => {
  if (seconds < 5) return 'flight';
  if (!returning && seconds < 13) return 'arrival';
  return seconds < (returning ? 11 : 21) ? 'landed' : 'fade';
};

/** A single AI-texture journey film. The parent may remount it to start a new cycle. */
export default function JourneyFilm({ returning = false }) {
  const hostRef = useRef(null);
  const stampRef = useRef(0);
  const pauseRef = useRef(0);
  const visibleRef = useRef(false);
  const [phase, setPhase] = useState('flight');
  const [flightVisible, setFlightVisible] = useState(true);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      host.style.setProperty('--mist-alpha', '0'); setPhase('landed'); setFlightVisible(false);
      return undefined;
    }
    const total = returning ? 14 : 24;
    let raf = 0; let active = true; let lastPhase = '';
    stampRef.current = performance.now();
    const tick = now => {
      if (!active || !visibleRef.current || document.hidden) return;
      let elapsed = (now - stampRef.current) / 1000;
      if (elapsed >= total) { stampRef.current = now; elapsed = 0; setCycle(value => value + 1); }
      const next = phaseFor(elapsed, returning);
      if (next !== lastPhase) { lastPhase = next; setPhase(next); setFlightVisible(next === 'flight' || next === 'arrival');const soundRegion=host.closest('[data-soundscape]');if(soundRegion)soundRegion.dataset.soundscape='ocean'; }
      const ending=Math.max(0,(elapsed-(total-3))/3);
      host.style.setProperty('--mist-alpha',(Math.sin(ending*Math.PI)*.35).toFixed(3));
      raf = requestAnimationFrame(tick);
    };
    const pause = () => { host.style.setProperty('--film-play-state','paused'); if (!pauseRef.current) pauseRef.current = performance.now(); cancelAnimationFrame(raf); };
    const resume = () => { host.style.setProperty('--film-play-state','running'); if (pauseRef.current) { stampRef.current += performance.now() - pauseRef.current; pauseRef.current = 0; } if (visibleRef.current && !document.hidden) raf = requestAnimationFrame(tick); };
    const observer = new IntersectionObserver(entries => { visibleRef.current = entries[0]?.isIntersecting === true; if (visibleRef.current) resume(); else pause(); }, { threshold: .05 });
    observer.observe(host);
    const visibility = () => { if (document.hidden) pause(); else resume(); };
    document.addEventListener('visibilitychange', visibility);
    return () => { active = false; cancelAnimationFrame(raf); observer.disconnect(); document.removeEventListener('visibilitychange', visibility); };
  }, [returning]);

  const title = returning ? '返回深圳' : '抵达关西';
  const place = returning ? 'NRT → SZX' : 'SZX → KIX';
  return <section ref={hostRef} className={`journey-film is-${phase}`} data-journey-film-phase={phase} aria-label={returning ? '返程视觉短片' : '深圳飞抵关西的视觉短片'}>
    <style>{styles}</style><div className="journey-film__layer journey-film__coast" style={{ '--coast': `url(${assets.coast})` }}/>
    {flightVisible && <div className={`journey-film__flight ${phase === 'flight' ? '' : 'is-gone'}`}><FlightCollage key={cycle} planeSrc={assets.aircraft} leg={returning ? 'return' : 'outbound'} autoPlay /></div>}
    {!returning && <div className="journey-film__arrival" style={{ '--travelers': `url(${assets.travelers})` }}><i className="journey-film__traveler"/><i className="journey-film__traveler"/><i className="journey-film__traveler"/><i className="journey-film__traveler"/></div>}
    <div className="journey-film__layer journey-film__mist" style={{ '--cloud': `url(${assets.cloud})` }}/>
    <h2 className="journey-film__copy">{title}</h2><p className="journey-film__place">{place}</p>
  </section>;
}
