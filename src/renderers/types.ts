export type ViewMode = "city" | "terrain";
export type Theme = "signature" | "natural";

/** City/Terrain 共用的最小生命周期契约；本次没有创建 WebGL 实例。 */
export interface RendererLifecycle {
  invalidate(): void;
  dispose(): void;
}
