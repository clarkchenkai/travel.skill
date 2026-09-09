# LivingLandscape contract

```jsx
import LivingLandscape from './LivingLandscape.jsx';

<LivingLandscape
  kind="river"
  src="/assets/kumano-river.webp"
  alt="大塔川旁的川汤温泉冨士屋"
  className="hotel-arrival-image"
/>
```

## 行为边界

- `kind` 只接受 `forest` 或 `river`，其他值回退为 `forest`。
- `src` 是调用方提供的本地或同源静态图片 URL。组件不请求外部纹理、不读写 `storage`，也不声称图片是实时现场。
- `<img>` 是首层内容，立即加载并提供唯一可访问替代文本。WebGL 只在同源纹理成功后覆盖其上，失败时保留静态图。
- `river` 只使图片下方的水面区域产生低振幅折射；点按/触碰水面会产生一次涟漪。山体和天空不变形。
- `forest` 不位移照片，只叠加低速的木漏日和稀疏空气粒子。没有整图风摆、落叶或季节性效果。
- 符合 `prefers-reduced-motion` 时不创建 canvas。离屏时停止动画；渲染密度上限为 DPR 1.5，帧率约 30fps。
- Canvas 保留浏览器纵向滑动，未设置 `touch-action:none`，不强制鼠标跟随。

根组件负责尺寸、圆角、文案、AI 生成标记及图片版权说明。酒店原照/生成图都应以本项目实际来源和授权状态显示，不能把本组件效果当作天气、流水声或现场体验的证据。
