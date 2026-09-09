import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const isReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
const validKind = kind => (kind === 'river' || kind === 'forest' || kind === 'waterfall' ? kind : 'forest');

const styles = `
  .living-landscape{position:relative;isolation:isolate;overflow:hidden;background:#182c2b;min-height:240px}
  .living-landscape__image,.living-landscape__canvas{display:block;position:absolute;inset:0;width:100%;height:100%}
  .living-landscape__image{object-fit:cover;object-position:center;transform:translateZ(0)}
  .living-landscape__canvas{z-index:1;opacity:0;transition:opacity 480ms cubic-bezier(.2,.7,.2,1);touch-action:pan-y}
  .living-landscape.is-live .living-landscape__canvas{opacity:1}
  @media (prefers-reduced-motion:reduce){.living-landscape__canvas{display:none}}
`;

const vertexShader = `
  varying vec2 vUv;
  void main(){ vUv=uv; gl_Position=vec4(position,1.0); }
`;

// The source photograph remains the dominant layer. This shader only displaces the lower
// water band, so ridges and sky never receive a liquid-like treatment.
const riverShader = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uImageRatio;
  uniform float uViewRatio;
  uniform vec2 uRipple;
  uniform float uRippleAge;

  vec2 coverUv(vec2 uv){
    if(uViewRatio>uImageRatio){ uv.y=(uv.y-.5)*(uImageRatio/uViewRatio)+.5; }
    else { uv.x=(uv.x-.5)*(uViewRatio/uImageRatio)+.5; }
    return uv;
  }
  void main(){
    float water=smoothstep(.43,.76,1.0-vUv.y);
    float smallWave=sin(vUv.x*58.0+uTime*.56)*.0016+sin(vUv.x*21.0-vUv.y*35.0+uTime*.34)*.0012;
    vec2 delta=vec2(smallWave*water, sin(vUv.x*32.0+uTime*.42)*.0008*water);
    float age=clamp(uRippleAge,0.0,2.1);
    vec2 local=(vUv-uRipple)*vec2(uViewRatio,1.0);
    float distance=length(local);
    float ring=sin(distance*78.0-age*19.0)*exp(-distance*5.0)*exp(-age*.8);
    delta+=normalize(local+vec2(.0001))*ring*.006*water;
    vec3 photo=texture2D(uTexture,coverUv(vUv+delta)).rgb;
    float highlight=(smallWave+.003)*water*20.0;
    gl_FragColor=vec4(photo+vec3(highlight*.055,highlight*.075,highlight*.065),1.0);
    #include <colorspace_fragment>
  }
`;

// Forest motion is additive light and sparse airborne matter. It intentionally does not
// offset the whole image: trunks, canopy and trail retain their photographed geometry.
const forestShader = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uImageRatio;
  uniform float uViewRatio;
  float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123); }
  vec2 coverUv(vec2 uv){
    if(uViewRatio>uImageRatio){ uv.y=(uv.y-.5)*(uImageRatio/uViewRatio)+.5; }
    else { uv.x=(uv.x-.5)*(uViewRatio/uImageRatio)+.5; }
    return uv;
  }
  void main(){
    vec3 photo=texture2D(uTexture,coverUv(vUv)).rgb;
    float canopy=smoothstep(.08,.78,vUv.y);
    float rayA=smoothstep(.052,0.0,abs((vUv.x-.18)-vUv.y*.26-sin(uTime*.09)*.012));
    float rayB=smoothstep(.038,0.0,abs((vUv.x-.68)+vUv.y*.19+sin(uTime*.07)*.009));
    float light=(rayA*.34+rayB*.22)*canopy*(.72+.28*sin(uTime*.23));
    vec2 cell=floor(vUv*vec2(27.0,43.0));
    vec2 seed=cell+vec2(3.7,8.2);
    float flicker=hash(seed);
    vec2 point=fract(seed*vec2(.317,.731));
    point.y=fract(point.y-uTime*(.006+flicker*.009));
    point.x+=sin(uTime*.16+flicker*6.283)*.002;
    float particle=smoothstep(.013,0.0,length(fract(vUv*vec2(27.0,43.0))-point));
    particle*=step(.28,canopy)*(flicker>.78?1.0:0.0);
    photo+=vec3(.46,.42,.27)*(light+particle*.14);
    gl_FragColor=vec4(photo,1.0);
    #include <colorspace_fragment>
  }
`;

const waterfallShader = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTexture;
uniform float uTime;
uniform float uImageRatio;
uniform float uViewRatio;
vec2 coverUv(vec2 uv){if(uViewRatio>uImageRatio){uv.y=(uv.y-.5)*(uImageRatio/uViewRatio)+.5;}else{uv.x=(uv.x-.5)*(uViewRatio/uImageRatio)+.5;}return uv;}
void main(){
 vec2 uv=coverUv(vUv);vec3 base=texture2D(uTexture,uv).rgb;
 float center=.67+.055*uv.y;float width=.028+(1.0-uv.y)*.028;
 float stream=(1.0-smoothstep(width,width+.025,abs(uv.x-center)))*smoothstep(.22,.65,dot(base,vec3(.2126,.7152,.0722)));
 vec2 delta=vec2(sin(uv.y*92.0+uTime*3.7)*.0012,sin(uv.y*126.0+uTime*4.6)*.0022)*stream;
 vec3 photo=texture2D(uTexture,uv+delta).rgb;
 photo+=vec3(.009,.013,.013)*stream*(.5+.5*sin(uv.y*90.0+uTime*5.0));
 gl_FragColor=vec4(photo,1.0);
 #include <colorspace_fragment>
}
`;

function createMaterial(kind, texture, imageRatio) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: texture },
      uTime: { value: 0 },
      uImageRatio: { value: imageRatio },
      uViewRatio: { value: 1 },
      uRipple: { value: new THREE.Vector2(.5, .72) },
      uRippleAge: { value: 99 },
    },
    vertexShader,
    fragmentShader: kind === 'river' ? riverShader : kind === 'waterfall' ? waterfallShader : forestShader,
    depthWrite: false,
    depthTest: false,
  });
}

/**
 * A local-image material vignette. `src` must be a same-origin/static asset URL.
 * Forest uses light/particles only; river reserves displacement for the lower image band.
 */
export default function LivingLandscape({ kind = 'forest', src, alt, className = '' }) {
  const hostRef = useRef(null);
  const [webglReady, setWebglReady] = useState(false);
  const landscapeKind = validKind(kind);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !src || isReducedMotion()) return undefined;
    let renderer;
    let scene;
    let camera;
    let geometry;
    let material;
    let texture;
    let frame = 0;
    let lastFrame = 0;
    let visible = true;
    let disposed = false;
    let resizeObserver;
    let intersectionObserver;
    let rippleStartedAt = -999;

    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };
    const dispose = () => {
      disposed = true;
      stop();
      intersectionObserver?.disconnect();
      resizeObserver?.disconnect();
      material?.dispose();
      geometry?.dispose();
      texture?.dispose();
      renderer?.dispose();
      renderer?.domElement.remove();
    };

    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setClearAlpha(0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.domElement.className = 'living-landscape__canvas';
      renderer.domElement.setAttribute('aria-hidden', 'true');
      host.append(renderer.domElement);
      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      geometry = new THREE.PlaneGeometry(2, 2);
      const loader = new THREE.TextureLoader();
      loader.load(src, loadedTexture => {
        if (disposed) { loadedTexture.dispose(); return; }
        texture = loadedTexture;
        texture.colorSpace = THREE.SRGBColorSpace;
        const imageRatio = texture.image.width / texture.image.height;
        material = createMaterial(landscapeKind, texture, imageRatio);
        scene.add(new THREE.Mesh(geometry, material));
        const resize = () => {
          const rect = host.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          renderer.setSize(rect.width, rect.height, false);
          material.uniforms.uViewRatio.value = rect.width / rect.height;
        };
        resize();
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);
        intersectionObserver = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          if (visible && !frame) render(performance.now());
        }, { threshold: .01 });
        intersectionObserver.observe(host);
        renderer.domElement.addEventListener('pointerdown', event => {
          if (landscapeKind !== 'river' || !material) return;
          const rect = renderer.domElement.getBoundingClientRect();
          material.uniforms.uRipple.value.set((event.clientX - rect.left) / rect.width, 1 - (event.clientY - rect.top) / rect.height);
          rippleStartedAt = performance.now();
        }, { passive: true });
        setWebglReady(true);
        render(performance.now());
      }, undefined, () => { if (!disposed) setWebglReady(false); });
    } catch {
      dispose();
      setWebglReady(false);
    }

    const render = now => {
      if (disposed || !visible || !material) { frame = 0; return; }
      if (now - lastFrame >= 33) {
        lastFrame = now;
        material.uniforms.uTime.value = now / 1000;
        material.uniforms.uRippleAge.value = (now - rippleStartedAt) / 1000;
        renderer.render(scene, camera);
      }
      frame = requestAnimationFrame(render);
    };
    return dispose;
  }, [landscapeKind, src]);

  return <figure ref={hostRef} className={`living-landscape living-landscape--${landscapeKind} ${webglReady ? 'is-live' : ''} ${className}`.trim()}>
    <style>{styles}</style>
    <img className="living-landscape__image" src={src} alt={alt} decoding="async" />
  </figure>;
}
