import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const WATER_KINDS = new Set(['manpa', 'fujiya', 'taoya']);

const MATERIALS = {
  manpa: { waterBand: [.49, .98], flow: .0038, hue: [0.18, 0.53, 0.62] },
  fujiya: { waterBand: [.42, .99], flow: .0047, hue: [0.32, 0.69, 0.62] },
  taoya: { waterBand: [.48, .99], flow: .0034, hue: [0.95, 0.57, 0.32] },
  imperial: { waterBand: [0, 0], flow: 0, hue: [1.0, 0.73, 0.38] },
  okura: { waterBand: [0, 0], flow: 0, hue: [1.0, 0.78, 0.47] },
};

const VERTEX = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT = /* glsl */`
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uPhoto;
  uniform sampler2D uForeground;
  uniform sampler2D uMask;
  uniform vec2 uPointer;
  uniform vec3 uHue;
  uniform float uTime;
  uniform float uPulse;
  uniform float uFlow;
  uniform float uMode;
  uniform float uHasForeground;
  uniform vec2 uParallax;

  float ring(vec2 uv, vec2 center, float radius, float width) {
    return 1.0 - smoothstep(width, width + .012, abs(distance(uv, center) - radius));
  }

  void main() {
    float mask = texture2D(uMask, vUv).r;
    vec2 pointer = uPointer;
    float distanceToTouch = distance(vUv, pointer);
    float pulse = exp(-distanceToTouch * 12.0) * uPulse;
    vec2 flow = vec2(
      sin((vUv.y * 28.0) + uTime * .95) * uFlow,
      cos((vUv.x * 22.0) + uTime * .68) * uFlow * .38
    );
    vec2 refract = normalize(vUv - pointer + vec2(.0001)) * pulse * .008;
    vec2 sampledUv = vUv;

    // 0 = water: movement remains within the painted mask.
    if (uMode < .5) sampledUv += flow * mask + refract * mask;
    // 1 = glass wall: no water distortion; only a short, touch-led refraction.
    else if (uMode < 1.5) sampledUv += refract * .62;
    // 2 = quiet lobby light: preserve photo geometry, change illumination only.

    vec3 photo = texture2D(uPhoto, sampledUv).rgb;
    vec4 foreground = texture2D(uForeground, vUv + uParallax * (.003 + pulse * .002));
    photo = mix(photo, foreground.rgb, foreground.a * uHasForeground);
    float sweep = smoothstep(.0, .22, sin(vUv.x * 5.0 - uTime * .36) * .5 + .5);
    float touchRing = ring(vUv, pointer, .06 + (1.0 - uPulse) * .08, .012) * uPulse;

    if (uMode < .5) {
      photo += uHue * (mask * .032 + pulse * mask * .12 + touchRing * mask * .08);
    } else if (uMode < 1.5) {
      photo += uHue * (sweep * .062 + pulse * .16 + touchRing * .19);
    } else {
      float roomLight = .018 + sin(uTime * .32) * .009;
      photo += uHue * (roomLight + pulse * .055 + touchRing * .04);
    }

    // The canvas is a transparent material layer. The <img> behind it remains the fallback.
    float alpha = uMode < .5 ? clamp(mask * .76 + pulse * .16, 0.0, .84) : .68;
    gl_FragColor = vec4(photo, alpha);
  }
`;

function makeWaterMask(kind) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d');
  const config = MATERIALS[kind] || MATERIALS.manpa;
  const start = config.waterBand[0] * canvas.height;
  const gradient = context.createLinearGradient(0, start - 16, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(.18, 'rgba(255,255,255,.78)');
  gradient.addColorStop(1, 'rgba(255,255,255,1)');
  context.fillStyle = gradient;
  context.fillRect(0, start - 16, canvas.width, canvas.height - start + 16);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function styles() {
  return `
    .hotel-plate{position:relative;width:100%;aspect-ratio:375/280;overflow:hidden;background:#1d292c;isolation:isolate}
    .hotel-plate__image,.hotel-plate__foreground,.hotel-plate__canvas{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:cover}
    .hotel-plate__image{z-index:0;object-position:center;filter:saturate(.95) contrast(1.015)}
    .hotel-plate__foreground{z-index:1;pointer-events:none;object-position:center;transform:translate3d(var(--hotel-foreground-x,0),var(--hotel-foreground-y,0),0);transition:transform 1.2s cubic-bezier(.2,.65,.2,1)}
    .hotel-plate__canvas{z-index:2;pointer-events:auto;touch-action:pan-y;opacity:0;transition:opacity .7s ease}
    .hotel-plate.is-ready .hotel-plate__canvas{opacity:1}.hotel-plate.prefers-reduced-motion .hotel-plate__canvas,.hotel-plate.prefers-reduced-motion .hotel-plate__foreground{transition:none}
    .hotel-plate:after{content:"";position:absolute;z-index:3;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(8,14,16,.03),transparent 44%,rgba(8,14,16,.14));mix-blend-mode:multiply}
    .hotel-plate__image.is-hidden{opacity:0}.hotel-plate__canvas:focus-visible{outline:3px solid rgba(255,245,204,.92);outline-offset:-5px}
  `;
}

/**
 * A photo-first hotel plate. `src` must be a user-supplied, high-fidelity image;
 * WebGL only adds a masked material layer and never replaces the <img> fallback.
 */
export default function HotelPlate({ kind = 'manpa', src, backgroundSrc, foregroundSrc, alt = '' }) {
  const hostRef = useRef(null);
  const imageRef = useRef(null);
  const [ready, setReady] = useState(false);
  const safeKind = MATERIALS[kind] ? kind : 'manpa';
  const baseSrc = backgroundSrc || src;

  useEffect(() => {
    const host = hostRef.current;
    const image = imageRef.current;
    if (!host || !image || !baseSrc) return undefined;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
    let renderer;
    let material;
    let geometry;
    let mask;
    let photo;
    let foreground;
    let frame = 0;
    let visible = false;
    let pageVisible = !document.hidden;
    let disposed = false;
    let startedAt = performance.now();
    let pulseStartedAt = -Infinity;
    let resizeObserver;
    let intersectionObserver;
    const config = MATERIALS[safeKind];

    const stop = () => { if (frame) cancelAnimationFrame(frame); frame = 0; };
    const canAnimate = () => visible && pageVisible && !disposed && !reduce;

    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power', preserveDrawingBuffer: false });
    } catch {
      return undefined;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = 'hotel-plate__canvas';
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute('aria-label', alt || '住宿氛围图片');
    host.append(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin('anonymous');
    mask = makeWaterMask(safeKind);
    const transparentPixel = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1, THREE.RGBAFormat);
    transparentPixel.needsUpdate = true;
    const uniforms = {
      uPhoto: { value: transparentPixel }, uForeground: { value: transparentPixel }, uMask: { value: mask }, uPointer: { value: new THREE.Vector2(.5, .5) },
      uHue: { value: new THREE.Color(...config.hue) }, uTime: { value: 0 }, uPulse: { value: 0 },
      uFlow: { value: WATER_KINDS.has(safeKind) ? config.flow : 0 }, uMode: { value: WATER_KINDS.has(safeKind) ? 0 : safeKind === 'imperial' ? 1 : 2 }, uHasForeground: { value: 0 }, uParallax: { value: new THREE.Vector2(0, 0) },
    };
    material = new THREE.ShaderMaterial({ vertexShader: VERTEX, fragmentShader: FRAGMENT, uniforms, transparent: true, depthWrite: false, depthTest: false });
    geometry = new THREE.PlaneGeometry(2, 2);
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    const resize = () => {
      const rect = host.getBoundingClientRect();
      renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
    };
    resize();
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);

    const render = (now) => {
      if (disposed) return;
      const seconds = (now - startedAt) / 1000;
      uniforms.uTime.value = reduce ? 0 : seconds;
      uniforms.uPulse.value = Math.max(0, 1 - (now - pulseStartedAt) / (reduce ? 1000 : 1300));
      renderer.render(scene, camera);
      if (canAnimate() || uniforms.uPulse.value > 0.001) frame = requestAnimationFrame(render);
      else frame = 0;
    };
    const start = () => { if (!frame && !disposed) frame = requestAnimationFrame(render); };

    const showTexture = (texture) => {
      if (disposed) { texture.dispose(); return; }
      photo = texture;
      photo.colorSpace = THREE.SRGBColorSpace;
      photo.minFilter = THREE.LinearFilter;
      photo.magFilter = THREE.LinearFilter;
      uniforms.uPhoto.value = photo;
      setReady(true);
      start();
    };
    textureLoader.load(baseSrc, showTexture, undefined, () => { /* The base <img> remains visible. */ });
    if (foregroundSrc) textureLoader.load(foregroundSrc, (texture) => {
      if (disposed) { texture.dispose(); return; }
      foreground = texture;
      foreground.colorSpace = THREE.SRGBColorSpace;
      foreground.minFilter = THREE.LinearFilter;
      foreground.magFilter = THREE.LinearFilter;
      uniforms.uForeground.value = foreground;
      uniforms.uHasForeground.value = 1;
      start();
    }, undefined, () => { /* Transparent front layer remains optional. */ });

    const imageReady = () => { if (!photo && image.complete) { /* keep HTML image as the guaranteed fallback */ } };
    image.addEventListener('load', imageReady);
    const pointer = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = 1 - (event.clientY - rect.top) / rect.height;
      uniforms.uPointer.value.set(x, y);
      uniforms.uParallax.value.set((x - .5) * .72, (y - .5) * .48);
      host.style.setProperty('--hotel-foreground-x', `${(x - .5) * 2.2}px`);
      host.style.setProperty('--hotel-foreground-y', `${(.5 - y) * 1.6}px`);
      pulseStartedAt = performance.now();
      renderer.domElement.focus({ preventScroll: true });
      start();
    };
    renderer.domElement.addEventListener('pointerdown', pointer, { passive: true });

    intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start(); else stop();
    }, { threshold: .12 });
    intersectionObserver.observe(host);
    const pageVisibility = () => { pageVisible = !document.hidden; if (pageVisible) start(); else stop(); };
    document.addEventListener('visibilitychange', pageVisibility);

    return () => {
      disposed = true;
      stop();
      image.removeEventListener('load', imageReady);
      document.removeEventListener('visibilitychange', pageVisibility);
      intersectionObserver?.disconnect();
      resizeObserver?.disconnect();
      renderer.domElement.removeEventListener('pointerdown', pointer);
      geometry?.dispose(); material?.dispose(); mask?.dispose(); transparentPixel.dispose(); photo?.dispose(); foreground?.dispose(); renderer?.dispose(); renderer?.domElement.remove();
    };
  }, [safeKind, baseSrc, foregroundSrc, alt]);

  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return <figure ref={hostRef} className={`hotel-plate hotel-plate--${safeKind} ${ready ? 'is-ready' : ''} ${reduce ? 'prefers-reduced-motion' : ''}`}>
    <style>{styles()}</style>
    <img ref={imageRef} className="hotel-plate__image" src={baseSrc} alt={alt} loading="lazy" decoding="async" />
    {foregroundSrc && <img className="hotel-plate__foreground" src={foregroundSrc} alt="" aria-hidden="true" loading="lazy" decoding="async" />}
  </figure>;
}
