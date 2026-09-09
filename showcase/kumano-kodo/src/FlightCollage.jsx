import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
const clamp = value => Math.min(1, Math.max(0, value));
const aspectOf = texture => {
  const image = texture?.image;
  return image?.width && image?.height ? image.width / image.height : 1;
};

/**
 * AI-image collage flight carrier.  Source assets are supplied by the parent;
 * this component contains no illustrated aircraft, SVG fallback, or branding.
 */
export default function FlightCollage({
  planeSrc,
  travelersSrc,
  backgroundSrc,
  leg = 'outbound',
  autoPlay = false,
  fadeExit = false,
  verticalOffset = 0,
  exitUpward = false,
  onFlightComplete,
}) {
  const hostRef = useRef(null);
  const callbackRef = useRef(onFlightComplete);
    const visibleRef = useRef(false);
  const pendingRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [fallback,setFallback]=useState(false);
  callbackRef.current = onFlightComplete;

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !planeSrc) return undefined;
    let renderer; let observer; let resizeObserver; let raf = 0;
    let active = true; let visible = false; let pausedAt = 0; let startAt = 0; let complete = false; let assetsReady = false; let firstFrameDrawn=false;
    const staticMotion = reducedMotion();
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' }); } catch { setFallback(true);const timer=setTimeout(()=>callbackRef.current?.({leg,fallback:true}),1400);return()=>clearTimeout(timer); }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.sortObjects = true;
    renderer.domElement.className = 'flight-collage__canvas';
    renderer.domElement.style.opacity='0';
    renderer.domElement.setAttribute('aria-label', leg === 'return' ? '返程班机视觉' : '抵达关西的班机视觉');
    host.prepend(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-3, 3, 1.7, -1.7, .1, 20); camera.position.z = 8;
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    const loaded = [];
    const load = source => new Promise(resolve => {
      if (!source) { resolve(null); return; }
      loader.load(source, texture => { texture.colorSpace = THREE.SRGBColorSpace; if(!active){texture.dispose();resolve(null);return;}loaded.push(texture); resolve(texture); }, undefined, () => resolve(null));
    });
    let plane; let cloud; let travelers;
    const direction = leg === 'return' ? -1 : 1;
    const path = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-4.4 * direction, -1.15, 1.2), new THREE.Vector3(-1.25 * direction, -.15, 1.0),
      new THREE.Vector3(.95 * direction, .85, .7), new THREE.Vector3(4.4 * direction, 1.28, .35),
    );
    const material = (texture, opacity = 1) => new THREE.SpriteMaterial({ map: texture, transparent: true, opacity, depthWrite: false, depthTest: true });
    const resize = () => {
      const width = Math.max(host.clientWidth, 1); const height = Math.max(280, host.clientHeight || width * .85);
      renderer.setSize(width, height, false);
      const unit = height / width * 3.2; camera.left = -3.2; camera.right = 3.2; camera.top = unit; camera.bottom = -unit; camera.updateProjectionMatrix();
      host.style.minHeight = `${height}px`;
    };
    const render = now => {
      if (!active || !visible || document.hidden) return;
      let progress = staticMotion ? 1 : 0;
      if (startAt) progress = clamp((now - startAt) / 4800);
      if (plane) {
        const point = path.getPoint(progress); plane.position.copy(point);
        plane.position.y += (camera.top - camera.bottom) * verticalOffset;
        if (exitUpward) {
          plane.position.x = -4.4 + 6.3 * (1 - Math.pow(1 - progress, 1.2));
          plane.position.y = camera.top - (camera.top - camera.bottom) * (.24 - .44 * progress * progress);
        }
        // Let the trailing wing leave softly before the parent unmounts the flight.
        plane.material.opacity = fadeExit && !exitUpward ? clamp((1 - progress) / .12) : 1;
        const scale = 1.85 + progress * .3; plane.scale.set(plane.userData.aspect * scale, scale, 1);
        plane.material.rotation = direction * (exitUpward ? -.12 + progress * .45 : -.12 + progress * .16 + Math.sin(progress * Math.PI) * .04);
      }
      if (cloud) { cloud.position.x = direction * ((progress - .5) * -.14); cloud.material.rotation = direction * -.008; }
      if (travelers) { travelers.material.opacity = progress > .94 ? (progress - .94) / .06 : 0; travelers.position.copy(path.getPoint(1)); travelers.position.y -= .4; }
      renderer.render(scene, camera);
      if(!firstFrameDrawn){firstFrameDrawn=true;renderer.domElement.style.opacity='1';setReady(true);}
      if (progress >= 1 && !complete) { complete = true; callbackRef.current?.({ leg, ...(staticMotion ? { reducedMotion: true } : {}) }); }
      if (!staticMotion && !complete) raf = requestAnimationFrame(render);
    };
    const start = () => {
      if (!visible || document.hidden || !assetsReady || complete || startAt) return;
      startAt = performance.now(); pendingRef.current = false; raf = requestAnimationFrame(render);
    };
    Promise.all([load(planeSrc), load(backgroundSrc), load(travelersSrc)]).then(([planeTexture, cloudTexture, travelerTexture]) => {
      if (!active || !planeTexture) return;
      if (cloudTexture) { cloud = new THREE.Sprite(material(cloudTexture, .82)); cloud.userData.aspect = aspectOf(cloudTexture); cloud.scale.set(cloud.userData.aspect * 7.5, 7.5, 1); cloud.position.z = -2; cloud.renderOrder = 0; scene.add(cloud); }
      if(direction<0){planeTexture.repeat.x=-1;planeTexture.offset.x=1;}plane = new THREE.Sprite(material(planeTexture)); plane.userData.aspect = aspectOf(planeTexture); plane.position.z = 1; plane.renderOrder = 2; scene.add(plane);
      if (travelerTexture) { travelers = new THREE.Sprite(material(travelerTexture, 0)); travelers.userData.aspect = aspectOf(travelerTexture); travelers.scale.set(travelers.userData.aspect * .58, .58, 1); travelers.position.z = 1.4; travelers.renderOrder = 3; scene.add(travelers); }
      resize(); assetsReady = true;
      if (staticMotion) { visible = true; render(performance.now()); return; }
      if (autoPlay || pendingRef.current) start();
    });
    resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host);
    const pause = () => { if (startAt && !pausedAt) pausedAt = performance.now(); cancelAnimationFrame(raf); raf = 0; };
    const resume = () => { if (pausedAt && startAt) startAt += performance.now() - pausedAt; pausedAt = 0; if (startAt) raf = requestAnimationFrame(render); else if (autoPlay || pendingRef.current) start(); };
    observer = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting === true; visibleRef.current = visible; if (visible) resume(); else pause(); }, { threshold: .05 });
    observer.observe(host);
    const visibility = () => { if (document.hidden) pause(); else if (visible) resume(); };
    document.addEventListener('visibilitychange', visibility);
    if (autoPlay) pendingRef.current = true;
    return () => {
      active = false; cancelAnimationFrame(raf); observer?.disconnect(); resizeObserver?.disconnect(); document.removeEventListener('visibilitychange', visibility);
      scene.traverse(node => node.material?.dispose?.()); loaded.forEach(texture => texture.dispose()); renderer.dispose(); renderer.domElement.remove();
    };
  }, [autoPlay, backgroundSrc, fadeExit, verticalOffset, exitUpward, leg, planeSrc, travelersSrc]);

  return <section ref={hostRef} className="flight-collage" data-flight-collage-ready={ready ? 'true' : 'false'} aria-label="班机启程">{fallback&&<img className="flight-collage__poster" src={planeSrc} alt="原创熊野主题班机" style={{transform:leg==='return'?'scaleX(-1)':undefined}}/>}</section>;
}
