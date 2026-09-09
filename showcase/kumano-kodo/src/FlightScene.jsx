import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

function sceneStyles() {
  return `
    .flight-scene{position:relative;isolation:isolate;width:100%;min-height:220px;overflow:hidden;border-radius:18px;
      background:linear-gradient(145deg,#e5eee6 0%,#f7f4ea 48%,#dce8e1 100%);color:#163b37}
    .flight-scene:before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.42;background-image:linear-gradient(90deg,#3d665c0d 1px,transparent 1px),linear-gradient(#3d665c0d 1px,transparent 1px);background-size:18px 18px}
    .flight-scene__canvas{display:block;position:absolute;inset:0;width:100%;height:100%;touch-action:pan-y;cursor:grab;outline:none}
    .flight-scene__canvas:active{cursor:grabbing}.flight-scene__label{position:absolute;top:16px;left:16px;z-index:2;margin:0;font:600 10px/1.1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.13em;color:#46756b}
    .flight-scene__airport{position:absolute;bottom:15px;z-index:2;display:flex;flex-direction:column;gap:3px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;pointer-events:none}
    .flight-scene__airport--origin{left:16px}.flight-scene__airport--destination{right:16px;text-align:right}.flight-scene__code{font-size:17px;line-height:1;font-weight:750;letter-spacing:.06em}.flight-scene__hint{font-size:10px;color:#5d746c;letter-spacing:.05em}
    .flight-scene__button{position:absolute;z-index:3;right:14px;top:12px;min-height:38px;padding:0 12px;border:1px solid #2b6157;border-radius:999px;background:#f7f4eade;color:#194a42;font:650 12px/1 system-ui,sans-serif;box-shadow:0 2px 8px #193f3514;backdrop-filter:blur(7px)}
    .flight-scene__button:active{transform:scale(.97)}.flight-scene__button:focus-visible{outline:2px solid #b86f40;outline-offset:2px}.flight-scene__fallback{position:absolute;inset:0;display:grid;place-items:center;color:#285e53}.flight-scene__fallback svg{width:min(82%,340px);height:auto;overflow:visible}
    @media (prefers-reduced-motion:reduce){.flight-scene__button{display:none}}
  `;
}

function fallbackPlane({ outbound }) {
  const direction = outbound ? 1 : -1;
  return <svg viewBox="0 0 380 180" aria-label="飞机与熊野航线示意" role="img">
    <defs><linearGradient id="flight-arc" x1="0" x2="1"><stop stopColor="#bd7142"/><stop offset="1" stopColor="#376d60"/></linearGradient></defs>
    <path d={outbound ? 'M48 124 C145 30 246 34 332 73' : 'M332 124 C235 30 134 34 48 73'} fill="none" stroke="url(#flight-arc)" strokeDasharray="3 7" strokeWidth="2" />
    <g transform={`translate(${direction > 0 ? 153 : 227} 69) scale(${direction} 1)`} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M-56 3 H28 L57 12 L28 18 H-56 Q-71 11 -56 3Z" fill="#245c51" stroke="#17453e" strokeWidth="2"/>
      <path d="M-16 5 L-4 -30 L11 -30 L8 5 M-16 16 L-4 42 L10 42 L8 16" fill="#f6f0df" stroke="#17453e" strokeWidth="2"/>
      <path d="M-46 3 L-56 -19 L-45 -19 L-29 4" fill="#b96f40" stroke="#17453e" strokeWidth="2"/>
      <path d="M19 4 L30 -8 L45 -8 L34 6" fill="#f6f0df" stroke="#17453e" strokeWidth="2"/>
      <circle cx="-25" cy="10" r="2" fill="#f6f0df"/><circle cx="-14" cy="10" r="2" fill="#f6f0df"/><circle cx="-3" cy="10" r="2" fill="#f6f0df"/>
    </g>
    <circle cx={outbound ? 48 : 332} cy="124" r="4" fill="#bd7142"/><circle cx={outbound ? 332 : 48} cy="73" r="4" fill="#376d60"/>
  </svg>;
}

function makePlane() {
  const plane = new THREE.Group();
  const forest = new THREE.MeshStandardMaterial({ color: 0x215c51, roughness: 0.48, metalness: 0.16 });
  const cream = new THREE.MeshStandardMaterial({ color: 0xf5eedb, roughness: 0.57, metalness: 0.08 });
  const ochre = new THREE.MeshStandardMaterial({ color: 0xb97040, roughness: 0.52, metalness: 0.12 });
  const windowMaterial = new THREE.MeshStandardMaterial({ color: 0xaed4ca, roughness: 0.12, metalness: 0.42, emissive: 0x234b45, emissiveIntensity: 0.15 });

  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(.15, .19, 2.34, 18, 1), forest);
  fuselage.rotation.z = Math.PI / 2;
  plane.add(fuselage);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(.19, .56, 18), forest);
  nose.rotation.z = -Math.PI / 2;
  nose.position.x = 1.43;
  plane.add(nose);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(.15, .38, 18), forest);
  tail.rotation.z = Math.PI / 2;
  tail.position.x = -1.32;
  plane.add(tail);

  const wingShape = new THREE.Shape();
  wingShape.moveTo(-.42, 0); wingShape.lineTo(.52, 0); wingShape.lineTo(.13, 1.34); wingShape.lineTo(-.15, 1.34); wingShape.closePath();
  const wing = new THREE.Mesh(new THREE.ExtrudeGeometry(wingShape, { depth: .055, bevelEnabled: false }), cream);
  wing.rotation.x = Math.PI / 2; wing.position.set(0, -.04, .03); plane.add(wing);
  const wingMirror = wing.clone(); wingMirror.scale.y = -1; plane.add(wingMirror);

  const stabilizer = new THREE.Mesh(new THREE.BoxGeometry(.52, .05, .8), cream);
  stabilizer.position.set(-1.0, .03, 0); plane.add(stabilizer);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(.34, .48, .055), ochre);
  fin.position.set(-1.04, .34, 0); fin.rotation.z = -.24; plane.add(fin);
  // A tiny three-cedar mark makes the tail a Kumano reference without using a carrier logo.
  [-1.13, -1.04, -.95].forEach((x, index) => {
    const cedar = new THREE.Mesh(new THREE.ConeGeometry(.045, .14 + (index === 1 ? .04 : 0), 5), forest);
    cedar.position.set(x, .39, .035); plane.add(cedar);
  });

  [-.42, .02, .46].forEach(x => {
    const window = new THREE.Mesh(new THREE.SphereGeometry(.047, 10, 8), windowMaterial);
    window.scale.set(1, .45, 1); window.position.set(x, .16, .17); plane.add(window);
  });
  [-.18, .23].forEach(x => {
    const engine = new THREE.Mesh(new THREE.CylinderGeometry(.1, .13, .4, 12), forest);
    engine.rotation.z = Math.PI / 2; engine.position.set(x, -.14, x < 0 ? .78 : -.78); plane.add(engine);
  });
  return { plane, materials: [forest, cream, ochre, windowMaterial] };
}

/**
 * Small original 3D plane vignette for a route introduction or epilogue.
 * `progress` takes over the flight position when supplied (0 = origin, 1 = destination).
 */
export default function FlightScene({ leg = 'outbound', origin, destination, progress, autoPlay = false, playKey = 0, onFlightComplete, showControls = false }) {
  const hostRef = useRef(null);
  const triggerRef = useRef(null);
  const staticEndpointRef = useRef(false);
  const progressRef = useRef(progress);
  const callbackRef = useRef(onFlightComplete);
  const completedRef = useRef(false);
  const seenPlayKeyRef = useRef(playKey);
  const autoPlayedRef = useRef(false);
  const visibleRef = useRef(false);
  const pendingStartRef = useRef(false);
  const takeOffRef = useRef(null);
  progressRef.current = progress;
  callbackRef.current = onFlightComplete;
  const dragRef = useRef({ active: false, x: 0, yaw: 0 });
  const [fallback, setFallback] = useState(false);
  const [flying, setFlying] = useState(false);
  const outbound = leg !== 'return';
  const originCode = origin || (outbound ? 'SZX' : 'NRT');
  const destinationCode = destination || (outbound ? 'KIX' : 'SZX');
  const controlled = Number.isFinite(progress);

  const takeOff = useCallback(() => {
    if (controlled) return;
    completedRef.current = false;
    if (reducedMotion()) {
      staticEndpointRef.current = true;
      callbackRef.current?.({ leg, origin: originCode, destination: destinationCode, reducedMotion: true });
      return;
    }
    if (!visibleRef.current || document.hidden) { pendingStartRef.current = true; return; }
    pendingStartRef.current = false;
    staticEndpointRef.current = false;
    triggerRef.current = performance.now();
    setFlying(true);
  }, [controlled, destinationCode, leg, originCode]);
  takeOffRef.current = takeOff;

  useEffect(() => {
    if (controlled) return;
    if (playKey !== seenPlayKeyRef.current) {
      seenPlayKeyRef.current = playKey;
      takeOff();
      return;
    }
    if (autoPlay && !autoPlayedRef.current) {
      autoPlayedRef.current = true;
      takeOff();
    }
  }, [autoPlay, controlled, playKey, takeOff]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || fallback) return undefined;
    let renderer;
    let raf = 0;
    let active = true;
    let visible = true;
    let disposed = false;
    let resizeObserver;
    let observer;
    const staticMotion = reducedMotion();
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      setFallback(true);
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = 'flight-scene__canvas';
    renderer.domElement.setAttribute('aria-label', `${originCode} 至 ${destinationCode} 的立体飞机航线，可单指横向拖动查看机身`);
    renderer.domElement.tabIndex = 0;
    host.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
    camera.position.set(0, 2.35, 6.7);
    const look = new THREE.Vector3(0, 0, 0);
    const ambient = new THREE.HemisphereLight(0xfffbef, 0x214d44, 2.2);
    const key = new THREE.DirectionalLight(0xffefd7, 2.3); key.position.set(3, 5, 5);
    scene.add(ambient, key);
    const route = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.5, -.48, -.2), new THREE.Vector3(-.75, .65, -.08), new THREE.Vector3(.85, .58, -.18), new THREE.Vector3(2.45, -.25, -.12),
    ]);
    const routePoints = route.getPoints(70);
    const routeLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(routePoints), new THREE.LineDashedMaterial({ color: 0xb87143, dashSize: .075, gapSize: .1, transparent: true, opacity: .92 }));
    routeLine.computeLineDistances(); scene.add(routeLine);
    const endpointMaterial = new THREE.MeshStandardMaterial({ color: 0x386c60, roughness: .4 });
    [routePoints[0], routePoints.at(-1)].forEach(point => { const dot = new THREE.Mesh(new THREE.SphereGeometry(.075, 14, 12), endpointMaterial); dot.position.copy(point); scene.add(dot); });
    const { plane, materials } = makePlane();
    const flight = new THREE.Group(); flight.add(plane); scene.add(flight);
    const direction = outbound ? 1 : -1;
    plane.rotation.y = direction < 0 ? Math.PI : 0;
    let yaw = direction < 0 ? -.28 : .28;
    let width = 0;
    const resize = () => {
      const rect = host.getBoundingClientRect();
      width = Math.max(1, rect.width);
      const height = Math.max(220, Math.min(300, width * .56));
      renderer.setSize(width, height, false);
      camera.aspect = width / height; camera.updateProjectionMatrix();
      host.style.minHeight = `${height}px`;
    };
    resize();
    resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host);
    const updatePosition = p => {
      const pathP = direction < 0 ? 1 - p : p;
      const point = route.getPointAt(clamp(pathP));
      flight.position.copy(point);
      flight.rotation.z = Math.sin(Math.PI * p) * .16 * direction;
      plane.rotation.y = (direction < 0 ? Math.PI : 0) + yaw;
    };
    const render = now => {
      if (!active || !visible || disposed) return;
      let p = controlled ? clamp(progressRef.current) : (staticEndpointRef.current ? 1 : 0);
      if (!controlled && triggerRef.current) {
        const elapsed = clamp((now - triggerRef.current) / 4000);
        p = elapsed * elapsed * (3 - 2 * elapsed);
        yaw += Math.sin(elapsed * Math.PI) * .006 * direction;
        if (elapsed >= 1) {
          triggerRef.current = null;
          staticEndpointRef.current = true;
          setFlying(false);
          if (!completedRef.current) {
            completedRef.current = true;
            callbackRef.current?.({ leg, origin: originCode, destination: destinationCode });
          }
        }
      }
      if (controlled && p >= .999 && !completedRef.current) {
        completedRef.current = true;
        callbackRef.current?.({ leg, origin: originCode, destination: destinationCode });
      }
      updatePosition(p);
      camera.position.x += (Math.sin(yaw) * 1.25 - camera.position.x) * .08;
      camera.lookAt(look);
      renderer.render(scene, camera);
      if (!staticMotion) raf = requestAnimationFrame(render);
    };
    let pausedAt = 0;
    const start = () => {
      if (!active || !visible || raf) return;
      if (staticMotion) { render(performance.now()); return; }
      raf = requestAnimationFrame(render);
    };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    const pauseClock = () => { if (triggerRef.current && !pausedAt) pausedAt = performance.now(); stop(); };
    const resumeClock = () => {
      if (pausedAt && triggerRef.current) triggerRef.current += performance.now() - pausedAt;
      pausedAt = 0;
      if (pendingStartRef.current) takeOffRef.current?.();
      start();
    };
    observer = new IntersectionObserver(entries => {
      visible = entries[0]?.isIntersecting === true;
      visibleRef.current = visible;
      if (visible && !document.hidden) resumeClock(); else pauseClock();
    }, { threshold: .05 });
    observer.observe(host);
    const visibility = () => { if (document.hidden) pauseClock(); else if (visibleRef.current) resumeClock(); };
    document.addEventListener('visibilitychange', visibility);
    const pointerDown = event => { if (!staticMotion) { dragRef.current = { active: true, x: event.clientX, yaw }; renderer.domElement.setPointerCapture?.(event.pointerId); } };
    const pointerMove = event => {
      if (!dragRef.current.active) return;
      const dx = event.clientX - dragRef.current.x;
      if (Math.abs(dx) > 2) yaw = dragRef.current.yaw + dx / Math.max(width, 1) * 1.8;
    };
    const pointerUp = event => { dragRef.current.active = false; renderer.domElement.releasePointerCapture?.(event.pointerId); };
    renderer.domElement.addEventListener('pointerdown', pointerDown);
    renderer.domElement.addEventListener('pointermove', pointerMove);
    renderer.domElement.addEventListener('pointerup', pointerUp);
    renderer.domElement.addEventListener('pointercancel', pointerUp);
    start();
    return () => {
      disposed = true; active = false; stop(); observer?.disconnect(); resizeObserver?.disconnect(); document.removeEventListener('visibilitychange', visibility);
      renderer.domElement.removeEventListener('pointerdown', pointerDown);
      renderer.domElement.removeEventListener('pointermove', pointerMove);
      renderer.domElement.removeEventListener('pointerup', pointerUp);
      renderer.domElement.removeEventListener('pointercancel', pointerUp);
      scene.traverse(node => { node.geometry?.dispose?.(); node.material && (Array.isArray(node.material) ? node.material : [node.material]).forEach(material => material.dispose?.()); });
      materials.forEach(material => material.dispose()); renderer.dispose(); renderer.domElement.remove();
    };
  }, [controlled, destinationCode, fallback, originCode, outbound, leg]);

  return <section className="flight-scene" ref={hostRef} aria-label={`${originCode} 至 ${destinationCode} 的${outbound ? '抵达' : '返程'}航段`}>
    <style>{sceneStyles()}</style>
    <p className="flight-scene__label">{outbound ? 'ARRIVING AT KUMANO' : 'LEAVING KUMANO'}</p>
    {fallback && <div className="flight-scene__fallback">{fallbackPlane({ outbound })}</div>}
    {showControls && !controlled && !fallback && <button className="flight-scene__button" type="button" onClick={takeOff} aria-pressed={flying}>{flying ? '正在越岭…' : '起飞看一眼'}</button>}
    <div className="flight-scene__airport flight-scene__airport--origin"><span className="flight-scene__code">{originCode}</span><span className="flight-scene__hint">{outbound ? '离开' : '返程起点'}</span></div>
    <div className="flight-scene__airport flight-scene__airport--destination"><span className="flight-scene__code">{destinationCode}</span><span className="flight-scene__hint">{outbound ? '抵达关西' : '回到城市'}</span></div>
  </section>;
}
