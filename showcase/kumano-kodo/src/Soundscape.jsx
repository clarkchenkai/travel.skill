import React, { useCallback, useEffect, useRef, useState } from 'react';

const scenes = new Set(['forest', 'river', 'ocean', 'city', 'quiet']);
const labels = { forest: '林间', river: '水流', ocean: '海风', city: '城市', quiet: '安静' };
const AudioCtor = () => window.AudioContext || window.webkitAudioContext;

function noiseSource(context, { low = 80, high = 1000, gain = .02, color = .5 }) {
  const seconds = 2;
  const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
  const data = buffer.getChannelData(0);
  let previous = 0;
  for (let index = 0; index < data.length; index += 1) {
    const white = Math.random() * 2 - 1;
    previous = previous * color + white * (1 - color);
    data[index] = previous;
  }
  const source = context.createBufferSource();
  const lowpass = context.createBiquadFilter();
  const highpass = context.createBiquadFilter();
  const level = context.createGain();
  source.buffer = buffer; source.loop = true;
  lowpass.type = 'lowpass'; lowpass.frequency.value = high;
  highpass.type = 'highpass'; highpass.frequency.value = low;
  level.gain.value = gain;
  source.connect(lowpass).connect(highpass).connect(level);
  source.start();
  return { source, output: level };
}

function createEngine() {
  const Constructor = AudioCtor();
  if (!Constructor) return null;
  const context = new Constructor();
  const master = context.createGain();
  master.gain.value = 0;
  master.connect(context.destination);
  const channels = {};
  const addChannel = (name, settings) => {
    const channel = context.createGain();
    channel.gain.value = 0;
    channel.connect(master);
    const sources = settings.map(config => {
      const part = noiseSource(context, config);
      part.output.connect(channel);
      return part;
    });
    channels[name] = { gain: channel.gain, sources };
  };
  addChannel('forest', [{ low: 190, high: 1700, gain: .021, color: .82 }]);
  addChannel('river', [{ low: 190, high: 2500, gain: .034, color: .42 }, { low: 950, high: 5600, gain: .009, color: .18 }]);
  addChannel('ocean', [{ low: 55, high: 650, gain: .035, color: .9 }, { low: 750, high: 2800, gain: .008, color: .35 }]);
  addChannel('city', [{ low: 50, high: 390, gain: .023, color: .94 }, { low: 440, high: 1600, gain: .004, color: .67 }]);
  let birdTimer = 0;
  let current = 'quiet';
  let muted = true;

  const chirp = () => {
    if (current !== 'forest' || muted || context.state !== 'running') return;
    const oscillator = context.createOscillator();
    const level = context.createGain();
    oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(1680, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(2350, context.currentTime + .095);
    level.gain.setValueAtTime(.0001, context.currentTime);
    level.gain.exponentialRampToValueAtTime(.009, context.currentTime + .015);
    level.gain.exponentialRampToValueAtTime(.0001, context.currentTime + .16);
    oscillator.connect(level).connect(master); oscillator.start(); oscillator.stop(context.currentTime + .18);
    birdTimer = window.setTimeout(chirp, 7000 + Math.round(Math.random() * 5000));
  };
  const setScene = (scene, audible) => {
    current = scenes.has(scene) ? scene : 'quiet';
    muted = !audible;
    const now = context.currentTime;
    Object.entries(channels).forEach(([name, channel]) => {
      channel.gain.cancelScheduledValues(now);
      channel.gain.setTargetAtTime(audible && name === current ? 1 : 0, now, .55);
    });
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(audible ? .58 : 0, now, .18);
    window.clearTimeout(birdTimer);
    if (audible && current === 'forest') birdTimer = window.setTimeout(chirp, 1300);
  };
  return {
    context,
    resume: () => context.resume(),
    setScene,
    close: () => {
      window.clearTimeout(birdTimer);
      Object.values(channels).flatMap(channel => channel.sources).forEach(part => { try { part.source.stop(); } catch {} });
      return context.close();
    },
  };
}

/**
 * Synthesized, opt-in page ambience. Add data-soundscape="forest|river|ocean|city|quiet"
 * to story sections; the largest visible section becomes the active scene.
 */
export default function Soundscape({ selector = '[data-soundscape]' }) {
  const engineRef = useRef(null);
  const sceneRef = useRef('quiet');
  const enabledRef = useRef(false);
  const ratiosRef = useRef(new Map());
  const [enabled, setEnabled] = useState(false);
  const [scene, setScene] = useState('quiet');
  const [status, setStatus] = useState('场景声未开启');
  const [unsupported, setUnsupported] = useState(false);

  const apply = useCallback((nextScene = sceneRef.current, nextEnabled = enabledRef.current) => {
    const safeScene = scenes.has(nextScene) ? nextScene : 'quiet';
    sceneRef.current = safeScene;
    engineRef.current?.setScene(safeScene, nextEnabled && !document.hidden);
    setScene(safeScene);
  }, []);

  useEffect(() => {
    const elements = [...document.querySelectorAll(selector)];
    const choose = () => {
      let bestScene = 'quiet';
      let bestRatio = 0;
      ratiosRef.current.forEach((visibleArea, element) => {
        const candidate = element.dataset.soundscape;
        if (visibleArea > bestRatio && scenes.has(candidate)) { bestRatio = visibleArea; bestScene = candidate; }
      });
      const center=window.innerHeight*.54;const centered=elements.filter(el=>{const r=el.getBoundingClientRect();return r.width>100&&r.top<=center&&r.bottom>=center&&scenes.has(el.dataset.soundscape)}).sort((a,b)=>a.getBoundingClientRect().height-b.getBoundingClientRect().height);if(centered.length)bestScene=centered[0].dataset.soundscape;const next=bestRatio>.08?bestScene:'quiet';if(next!==sceneRef.current)apply(next);
    };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => ratiosRef.current.set(entry.target, entry.intersectionRect.width * entry.intersectionRect.height));
      choose();
    }, { threshold: [0, .08, .2, .4, .6, .8, 1] });
    elements.forEach(element => observer.observe(element));const changes=new MutationObserver(choose);elements.forEach(element=>changes.observe(element,{attributes:true,attributeFilter:['data-soundscape']}));
    let scrollFrame=0;const onScroll=()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;choose()})};window.addEventListener('scroll',onScroll,{passive:true});const visibility = () => apply(sceneRef.current, enabledRef.current);
    document.addEventListener('visibilitychange', visibility);
    return () => { observer.disconnect(); changes.disconnect();window.removeEventListener('scroll',onScroll);cancelAnimationFrame(scrollFrame); document.removeEventListener('visibilitychange', visibility); };
  }, [apply, selector]);

  useEffect(() => () => { engineRef.current?.close(); engineRef.current = null; }, []);

  const toggle = async () => {
    if (enabledRef.current) {
      enabledRef.current = false; setEnabled(false); apply(sceneRef.current, false); setStatus('场景声已静音');
      return;
    }
    if (!AudioCtor()) { setUnsupported(true); setStatus('此浏览器不支持场景声'); return; }
    if (!engineRef.current) engineRef.current = createEngine();
    try {
      await engineRef.current.resume();
      enabledRef.current = true; setEnabled(true); setUnsupported(false);
      apply(sceneRef.current, true);
      setStatus('场景声已开启');
    } catch {
      setStatus('场景声无法启动，请检查浏览器设置');
    }
  };

  return <div className="soundscape-control" data-audio-enabled={enabled ? 'true' : 'false'} data-audio-scene={scene}>
    <button type="button" className="soundscape-control__button" onClick={toggle} aria-pressed={enabled} aria-describedby="soundscape-status">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6L8 10H4Zm12.4-1.7a5 5 0 0 1 0 7.4M18.7 6a8 8 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
      <span>{enabled ? '静音场景声' : '开启场景声'}</span>
    </button>
    <span id="soundscape-status" className="soundscape-control__status" aria-live="polite">{unsupported ? status : `${status} · 当前：${labels[scene]}`}</span>
  </div>;
}
