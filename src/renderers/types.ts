export type ViewMode = "city" | "terrain";
export type Theme = "signature" | "natural";

/** 工程原型的最小生命周期契约；具体资源由实现管理。 */
export interface RendererLifecycle {
  invalidate(): void;
  dispose(): void;
}

/** 当前两种视图共享屏幕缩放/平移与生长时钟，绘制引擎各自拥有资源。 */
export interface LandscapeViewport {
  width: number; height: number; dpr: number;
  zoom: number; panX: number; panY: number; dark: boolean;
}
export interface LandscapeView {
  canvas: HTMLCanvasElement;
  maxZoom?(viewport: LandscapeViewport): number;
  draw(progress: number, viewport: LandscapeViewport): void;
  description(): string;
  dispose(): void;
}
