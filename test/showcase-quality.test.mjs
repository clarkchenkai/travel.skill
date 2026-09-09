import test from 'node:test';
import assert from 'node:assert/strict';
import {renderPixelRatio} from '../showcase/kumano-kodo/src/render-quality.mjs';

test('desktop canvas can reach native 2x while mobile retains its pixel budget', () => {
  assert.equal(renderPixelRatio(1920,1080,2),2);
  assert.equal(renderPixelRatio(1280,800,2),2);
  assert.equal(renderPixelRatio(640,330,2,1920),2);
  assert.equal(renderPixelRatio(390,844,3),1.5);
  assert.equal(renderPixelRatio(1920,1080,1),1);
});

test('large canvas buffers stay within 4K pixels and invalid DPR falls back safely', () => {
  for (const [w,h,dpr] of [[3840,2160,2],[5120,2880,2],[1920,2000,3]]) {
    const ratio=renderPixelRatio(w,h,dpr);
    assert.ok(w*h*ratio*ratio <= 3840*2160+1);
  }
  assert.equal(renderPixelRatio(1280,800,NaN),1);
});

import {existsSync} from 'node:fs';
import {photoVariants, photoSrcset, scenePhotoSource} from '../showcase/kumano-kodo/image-quality.mjs';
test('responsive photos preserve mobile URLs and map cache version; all HD sources ship', () => {
  for (const [src,item] of Object.entries(photoVariants)) {
    assert.ok(existsSync(new URL('../showcase/kumano-kodo/'+item.hd,import.meta.url)));
    assert.equal(scenePhotoSource(src,false),src);
    assert.equal(scenePhotoSource(src,true),item.hd);
    assert.ok(item.width>item.originalWidth);
  }
  const map='assets/route-overview-ai.png?v=20260908-no-footer';
  assert.ok(photoSrcset(map).startsWith(map+' 1024w,'));
  assert.equal(photoSrcset('assets/unknown.webp'),undefined);
  assert.equal(scenePhotoSource('assets/unknown.webp',true),'assets/unknown.webp');
});
