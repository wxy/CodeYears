import type { CityVehicle } from './city-vehicles';
import type { OrganizationPoster } from './city-organization-boards';

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
export interface CityRoadLabel { label:string; returning:boolean }
export interface LandscapeView {
  canvas: HTMLCanvasElement;
  setVehicles?(vehicles: readonly CityVehicle[]): void;
  setRoadCount?(count: number): void;
  setRoadLabels?(labels:readonly CityRoadLabel[],returnLabel?:string):void;
  setOrganizationPosters?(posters:readonly OrganizationPoster[]):void;
  organizationFaces?(viewport:LandscapeViewport):readonly {left:number;top:number;size:number;slope:number}[];
  /** 出城路的屏幕位置，与画布共用投影和取景。 */
  roadExits?(viewport: LandscapeViewport): readonly { board:[number,number][]; polygon: [number, number][] }[];
  returnPost?(viewport: LandscapeViewport): { board:[number,number][]; polygon:[number,number][] } | undefined;
  /** 已显示建筑在创建此视图的数据快照中的成员索引。 */
  buildingAt?(x: number, y: number, viewport: LandscapeViewport): readonly number[] | undefined;
  stepBuilding?(backward: boolean, viewport: LandscapeViewport): {x:number;y:number} | undefined;
  highlightBuilding?(point: {x:number;y:number} | undefined, viewport: LandscapeViewport): void;
  fitOverview?(viewport:LandscapeViewport,topInset:number,bottomInset:number):Pick<LandscapeViewport,'zoom'|'panX'|'panY'> | undefined;
  maxZoom?(viewport: LandscapeViewport): number;
  draw(progress: number, viewport: LandscapeViewport): void;
  description(): string;
  dispose(): void;
}
