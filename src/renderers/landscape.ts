import * as THREE from "three";
import type { DailyContribution } from "../data/types";
import { createTimeline } from "../timeline/controller";
import type { TimelineState } from "../timeline/types";
import type { ViewMode } from "./types";
import { yearTone } from "./palette";
import { planCityParcels, type ContributionCell } from "./city-parcels";

export interface ContributionLandscape {
  setView(view: ViewMode): void;
  zoomBy(factor: number): void;
  pause(): void;
  resume(): void;
  skip(): void;
  replay(): void;
  dispose(): void;
}

/** 贡献风景只消费可信数据；街区、植被与地形塑形不改动原始数量。 */
export function createLandscape(host: HTMLElement, days: readonly DailyContribution[], onChange: (state: TimelineState, error?: string, detail?: string) => void, initialView: ViewMode = "city"): ContributionLandscape {
  const columns = Math.ceil(Math.sqrt(days.length) * 1.3), rows = Math.ceil(days.length / columns);
  const pitch = 1.6, street = 2.2, parkColumn = Math.floor(columns / 8) * 4;
  const parkWidth = Math.max(6, columns * pitch * 0.13);
  const cityX = (column: number) => column * pitch + Math.floor(column / 4) * street + (column >= parkColumn ? parkWidth : 0);
  const cityZ = (row: number) => row * pitch + Math.floor(row / 4) * street + Math.floor(row / 16) * 1.2;
  const width = cityX(columns - 1) + pitch, depth = cityZ(rows - 1) + pitch;
  const margin = Math.max(width, depth) * 0.16 + 3, landWidth = width + margin * 2, landDepth = depth + margin * 2;
  const radius = Math.hypot(landWidth, landDepth) / 2;
  const raw = days.map(day => Math.log1p(day.count)), strongest = Math.max(...raw, 1);
  let smooth: readonly number[] = raw;
  const weights = [1, 2, 3, 4, 3, 2, 1];
  for (let pass = 0; pass < 2; pass++) {
    const previous = smooth;
    smooth = raw.map((_, index) => {
      const row = Math.floor(index / columns), column = index % columns;
      let total = 0, weight = 0;
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
        const r = row + dy, c = column + dx, i = r * columns + c;
        if (r >= 0 && r < rows && c >= 0 && c < columns && i < days.length) {
          const w = weights[dy + 3] * weights[dx + 3]; total += previous[i] * w; weight += w;
        }
      }
      return total / weight;
    });
  }
  const valley = Math.min(...smooth), relief = Math.max(Math.max(...smooth) - valley, 0.01), terrainScale = Math.hypot(width, depth) * 0.16;
  const terrainHeights = smooth.map(value => Math.pow((value - valley) / relief, 1.45) * terrainScale);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.style.cssText = "display:block;width:100%;height:100%;touch-action:none;background:transparent";
  host.append(renderer.domElement);
  const scene = new THREE.Scene(), distance = radius * 3 + 30;
  const ambient = new THREE.HemisphereLight(0xdce9f5, 0x758368, 2.1); scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffead1, 3.1);
  sun.position.set(-radius * 0.6, radius * 1.4 + 20, radius * 0.7);
  sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.normalBias = 0.15; sun.shadow.bias = -0.0005;
  const shadow = sun.shadow.camera;
  shadow.left = shadow.bottom = -radius * 1.2; shadow.right = shadow.top = radius * 1.2;
  shadow.near = 1; shadow.far = radius * 5 + 100; shadow.updateProjectionMatrix(); scene.add(sun);
  const textures: THREE.Texture[] = [];
  const texture = (canvas: HTMLCanvasElement) => {
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4); map.flipY = false; textures.push(map); return map;
  };
  const grain = document.createElement("canvas"); grain.width = grain.height = 128;
  const grainContext = grain.getContext("2d")!, image = grainContext.createImageData(128, 128);
  let seed = 739391;
  for (let i = 0; i < image.data.length; i += 4) {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    const value = 212 + (seed >>> 0) % 44;
    image.data[i] = image.data[i + 1] = image.data[i + 2] = value; image.data[i + 3] = 255;
  }
  grainContext.putImageData(image, 0, 0);
  function softEdge(canvas: HTMLCanvasElement, blur = 0.012) {
    const mask = document.createElement("canvas"); mask.width = mask.height = 512;
    const m = mask.getContext("2d")!; m.scale(512, 512); m.fillStyle = "white";
    m.beginPath(); m.moveTo(0.17, 0.04);
    m.bezierCurveTo(0.35, 0.015, 0.58, 0.075, 0.81, 0.035);
    m.bezierCurveTo(0.94, 0.02, 0.98, 0.12, 0.96, 0.27);
    m.bezierCurveTo(0.94, 0.46, 0.995, 0.63, 0.96, 0.82);
    m.bezierCurveTo(0.945, 0.96, 0.85, 0.99, 0.7, 0.955);
    m.bezierCurveTo(0.5, 0.93, 0.34, 0.995, 0.17, 0.96);
    m.bezierCurveTo(0.03, 0.94, 0.02, 0.83, 0.055, 0.65);
    m.bezierCurveTo(0.09, 0.47, 0.01, 0.34, 0.045, 0.17);
    m.bezierCurveTo(0.06, 0.065, 0.09, 0.045, 0.17, 0.04); m.closePath(); m.fill();
    const context = canvas.getContext("2d")!;
    context.globalCompositeOperation = "destination-in"; context.filter = `blur(${canvas.width * blur}px)`;
    context.drawImage(mask, 0, 0, canvas.width, canvas.height); context.filter = "none";
    // 模糊不能在纹理边缘被截成可见矩形，最外沿继续淡到完全透明。
    for (const [x, y] of [[canvas.width, 0], [0, canvas.height]]) {
      const fade = context.createLinearGradient(0, 0, x, y);
      fade.addColorStop(0, "transparent"); fade.addColorStop(0.1, "white"); fade.addColorStop(0.9, "white"); fade.addColorStop(1, "transparent");
      context.fillStyle = fade; context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.globalCompositeOperation = "source-over";
  }
  let facades: THREE.Texture[] | undefined;
  function facadeMaps() {
    if (facades) return facades;
    facades = [0, 1, 2].map(style => {
      const canvas = document.createElement("canvas"); canvas.width = 128; canvas.height = 256;
      const context = canvas.getContext("2d")!;
      context.fillStyle = ["#ece3d4", "#c5d9e2", "#e5e9e5"][style]; context.fillRect(0, 0, 128, 256);
      const columns = style === 1 ? 4 : 5;
      for (let r = 0; r < 12; r++) {
        context.fillStyle = style === 1 ? "#9bb2be" : "#c9c0ad"; context.fillRect(0, r * 21 + 20, 128, 1);
        for (let c = 0; c < columns; c++) {
          context.fillStyle = (r * 7 + c) % 17 === 0 ? "#d8caa5" : ["#526374", "#7194a7", "#6b8d9c"][style];
          const inset = style === 1 ? 1 : 5;
          context.fillRect(c * 128 / columns + inset, r * 21 + 4, 128 / columns - inset * 2, style === 1 ? 16 : 12);
          if (style === 1 && c === 1) { context.fillStyle = "#b4ceda"; context.fillRect(c * 32 + 1, r * 21 + 4, 11, 16); }
          if (style === 0) { context.fillStyle = "#f4eee2"; context.fillRect(c * 128 / columns + 3, r * 21 + 17, 128 / columns - 6, 2); }
        }
      }
      return texture(canvas);
    });
    return facades;
  }
  let cityGroundMap: THREE.Texture | undefined;
  function groundMap() {
    if (cityGroundMap) return cityGroundMap;
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = 1024;
    const context = canvas.getContext("2d")!, px = (x: number) => (x / landWidth + 0.5) * 1024, py = (z: number) => (z / landDepth + 0.5) * 1024;
    context.fillStyle = "#8ca575"; context.fillRect(0, 0, 1024, 1024);
    for (let r = 0; r < rows; r += 4) for (let c = 0; c < columns; c += 4) {
      const x = cityX(c) - width / 2, z = cityZ(r) - depth / 2;
      const w = cityX(Math.min(c + 3, columns - 1)) + pitch - cityX(c), d = cityZ(Math.min(r + 3, rows - 1)) + pitch - cityZ(r);
      context.fillStyle = "#d4d2c8"; context.fillRect(px(x - 0.3), py(z - 0.3), (w + 0.6) / landWidth * 1024, (d + 0.6) / landDepth * 1024);
    }
    // 零贡献是草地，低贡献植被也有自己的绿色地块；不再铺一个矮方块。
    for (let index = 0; index < days.length; index++) if (days[index].count <= 5) {
      const x = cityX(index % columns) - width / 2, z = cityZ(Math.floor(index / columns)) - depth / 2;
      context.fillStyle = days[index].count === 0 ? "#73995e" : "#638953";
      context.fillRect(px(x), py(z), pitch / landWidth * 1024, pitch / landDepth * 1024);
    }
    const roadXs: number[] = [], roadZs: { start: number; size: number }[] = [];
    context.strokeStyle = "#414b52"; context.lineWidth = street * 0.75 / landWidth * 1024;
    context.strokeRect(px(-width / 2 - street * 0.65), py(-depth / 2 - street * 0.65), (width + street * 1.3) / landWidth * 1024, (depth + street * 1.3) / landDepth * 1024);
    context.fillStyle = "#414b52";
    for (let c = 4; c < columns; c += 4) {
      const x = cityX(c) - width / 2 - street; roadXs.push(x);
      context.fillRect(px(x), py(-depth / 2 - street), street / landWidth * 1024, (depth + street * 2) / landDepth * 1024);
    }
    for (let r = 4; r < rows; r += 4) {
      const size = street + (r % 16 === 0 ? 1.2 : 0), z = cityZ(r) - depth / 2 - size; roadZs.push({ start: z, size });
      context.fillRect(px(-width / 2 - street), py(z), (width + street * 2) / landWidth * 1024, size / landDepth * 1024);
    }
    context.strokeStyle = "#c6bb91"; context.lineWidth = Math.max(0.7, 0.06 / landWidth * 1024); context.setLineDash([0.8 / landWidth * 1024, 0.9 / landWidth * 1024]);
    for (const x of roadXs) { context.beginPath(); context.moveTo(px(x + street / 2), py(-depth / 2 - street)); context.lineTo(px(x + street / 2), py(depth / 2 + street)); context.stroke(); }
    for (const road of roadZs) { context.beginPath(); context.moveTo(px(-width / 2 - street), py(road.start + road.size / 2)); context.lineTo(px(width / 2 + street), py(road.start + road.size / 2)); context.stroke(); }
    context.setLineDash([]); context.fillStyle = "#e3e2d5";
    for (const x of roadXs) for (const road of roadZs) for (let stripe = 0; stripe < 5; stripe++) {
      for (const sign of [-1, 1]) {
        context.fillRect(px(x + 0.28 + stripe * (street - 0.56) / 5), py(road.start + road.size / 2 + sign * (road.size / 2 + 0.45)), 0.2 / landWidth * 1024, 0.7 / landDepth * 1024);
        context.fillRect(px(x + street / 2 + sign * (street / 2 + 0.45)), py(road.start + 0.28 + stripe * (road.size - 0.56) / 5), 0.7 / landWidth * 1024, 0.2 / landDepth * 1024);
      }
    }
    const parkStart = cityX(parkColumn) - width / 2 - parkWidth - street;
    context.fillStyle = "#799c64"; context.fillRect(px(parkStart), py(-depth / 2), (parkWidth + street) / landWidth * 1024, depth / landDepth * 1024);
    context.strokeStyle = "#d8cead"; context.lineWidth = 4;
    context.beginPath(); context.moveTo(px(parkStart + parkWidth * 0.4), py(-depth / 2));
    context.bezierCurveTo(px(parkStart + parkWidth * 0.9), py(-depth * 0.2), px(parkStart + parkWidth * 0.1), py(depth * 0.15), px(parkStart + parkWidth * 0.6), py(depth / 2)); context.stroke();
    context.fillStyle = "#7eacb5"; context.beginPath(); context.ellipse(px(parkStart + parkWidth * 0.5), py(depth * 0.18), parkWidth * 0.22 / landWidth * 1024, depth * 0.08 / landDepth * 1024, -0.2, 0, Math.PI * 2); context.fill();
    context.globalAlpha = 0.12; context.fillStyle = context.createPattern(grain, "repeat")!; context.fillRect(0, 0, 1024, 1024); context.globalAlpha = 1;
    softEdge(canvas, 0.035); const map = texture(canvas); map.flipY = true; cityGroundMap = map; return map;
  }
  let surfaceMap: THREE.Texture | undefined;
  function terrainMap() {
    if (surfaceMap) return surfaceMap;
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = 512;
    const context = canvas.getContext("2d")!; context.fillStyle = context.createPattern(grain, "repeat")!; context.fillRect(0, 0, 512, 512);
    softEdge(canvas); surfaceMap = texture(canvas); return surfaceMap;
  }
  let stadiumFieldMap: THREE.Texture | undefined;
  function fieldMap() {
    if (stadiumFieldMap) return stadiumFieldMap;
    const canvas = document.createElement("canvas"); canvas.width = 128; canvas.height = 256;
    const context = canvas.getContext("2d")!; context.fillStyle = "#61945c"; context.fillRect(0,0,128,256);
    context.fillStyle = "#73a367"; for (let stripe=0;stripe<8;stripe++) context.fillRect(0,stripe*32,128,16);
    context.strokeStyle = "#dce8d0"; context.lineWidth = 2; context.strokeRect(10,10,108,236); context.beginPath(); context.moveTo(10,128); context.lineTo(118,128); context.stroke(); context.beginPath(); context.arc(64,128,22,0,Math.PI*2); context.stroke();
    stadiumFieldMap = texture(canvas); return stadiumFieldMap;
  }
  // 沿用时间轴作为归一化生长时钟；播放头不再表示逐日显隐。
  const timeline = createTimeline(days.length), lift = { value: 0 }, altitudeScale = { value: terrainScale };
  const glslColor = (hex: number) => `vec3(${new THREE.Color(hex).toArray().map(value => value.toFixed(5)).join(",")})`;
  // 整片场景从地面抬升；低矮对象先达到终态，高处继续生长。阴影共用位移。
  function grow(material: THREE.Material, instanced: boolean, terrainColor = false) {
    material.onBeforeCompile = shader => {
      shader.uniforms.uLevel = lift; shader.uniforms.uRelief = altitudeScale;
      shader.vertexShader = `uniform float uLevel; ${instanced ? "attribute float targetHeight;" : ""} ${terrainColor ? "varying float vSurfaceHeight;" : ""}\n` + shader.vertexShader;
      const transform = instanced ? "float rise = clamp(uLevel / targetHeight, 0.0, 1.0); transformed.y = transformed.y * rise + instanceMatrix[3].y / instanceMatrix[1].y * (rise - 1.0);" : "transformed.y = min(transformed.y, uLevel);";
      shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>\n${transform}\n${terrainColor ? "vSurfaceHeight = transformed.y;" : ""}`);
      if (!instanced) shader.vertexShader = shader.vertexShader.replace("#include <beginnormal_vertex>", "#include <beginnormal_vertex>\nif (position.y > uLevel) objectNormal = vec3(0.0, 1.0, 0.0);");
      if (terrainColor) {
        shader.fragmentShader = "varying float vSurfaceHeight; uniform float uRelief;\n" + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>\nfloat altitude = vSurfaceHeight / uRelief;\nvec3 landColor = mix(${glslColor(0x53834f)}, ${glslColor(0x87967b)}, smoothstep(0.08, 0.46, altitude));\nlandColor = mix(landColor, ${glslColor(0x96988e)}, smoothstep(0.48, 0.75, altitude));\nlandColor = mix(landColor, ${glslColor(0xf1f4f3)}, smoothstep(0.75, 0.91, altitude));\ndiffuseColor.rgb *= landColor;`);
      }
    };
    material.customProgramCacheKey = () => `codeyears-global-lift-${instanced}-${terrainColor}`;
  }
  type Group = ContributionCell;
  function groupsFor(step: number): Group[] {
    const groups: Group[] = [];
    const add = (x: number, z: number, w: number, d: number) => {
      let count = 0;
      for (let r = z; r < z + d; r++) for (let c = x; c < x + w; c++) count += days[r * columns + c].count;
      groups.push({ x, z, w, d, end: (z + d - 1) * columns + x + w, count, mean: count / (w * d) });
    };
    for (let z = 0; z < rows; z += step) for (let x = 0; x < columns; x += step) {
      const w = Math.min(step, columns - x), d = Math.min(step, rows - z);
      if ((z + d - 1) * columns + x + w <= days.length) add(x, z, w, d);
      else for (let r = z; r < z + d && r * columns + x < days.length; r++) add(x, r, Math.min(w, days.length - r * columns - x), 1);
    }
    return groups.sort((a, b) => a.end - b.end);
  }
  type Placement = { x: number; y: number; z: number; sx: number; sy: number; sz: number; top: number; color: THREE.Color };
  function buildView(mode: ViewMode, step: number) {
    const groups = groupsFor(step), root = new THREE.Group(), geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), instances: THREE.InstancedMesh[] = [];
    let heightLimit = 1;
    const ownMaterial = <T extends THREE.Material>(material: T) => { materials.add(material); return material; };
    function addInstances(geometry: THREE.BufferGeometry, material: THREE.Material | THREE.Material[], placements: Placement[]) {
      if (!placements.length) { geometry.dispose(); return; }
      geometries.add(geometry); geometry.setAttribute("targetHeight", new THREE.InstancedBufferAttribute(new Float32Array(placements.map(item => item.top)), 1));
      const mesh = new THREE.InstancedMesh(geometry, material, placements.length), matrix = new THREE.Matrix4();
      placements.forEach((item, index) => {
        matrix.makeScale(item.sx, item.sy, item.sz); matrix.setPosition(item.x, item.y, item.z); mesh.setMatrixAt(index, matrix); mesh.setColorAt(index, item.color); heightLimit = Math.max(heightLimit, item.top);
      });
      mesh.instanceMatrix.needsUpdate = true; mesh.castShadow = mesh.receiveShadow = true; mesh.frustumCulled = false;
      const depthMaterial = ownMaterial(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking })); grow(depthMaterial, true); mesh.customDepthMaterial = depthMaterial;
      root.add(mesh); instances.push(mesh);
    }
    sun.castShadow = mode === "city";
    if (mode === "city") {
      const groundGeometry = new THREE.PlaneGeometry(landWidth, landDepth); geometries.add(groundGeometry);
      const groundMaterial = ownMaterial(new THREE.MeshStandardMaterial({ map: groundMap(), roughness: 1, transparent: true, depthWrite: false, alphaTest: 0.01 }));
      const ground = new THREE.Mesh(groundGeometry, groundMaterial); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.04; ground.receiveShadow = true; ground.renderOrder = 0; root.add(ground);
      const parcels = planCityParcels(groups, days, columns, rows, strongest);
      const brick: Placement[] = [], glass: Placement[] = [], stone: Placement[] = [], roofs: Placement[] = [], gables: Placement[] = [], vaults: Placement[] = [];
      const roundTowers: Placement[] = [], roundRoofs: Placement[] = [], stands: Placement[] = [], stadiumRoofs: Placement[] = [], fields: Placement[] = [];
      const trunks: Placement[] = [], crowns: Placement[] = [], shrubs: Placement[] = [];
      const floorHeight = Math.max(0.5, radius * 0.009);
      const addTree = (x: number, z: number, h: number, spread: number, index: number) => {
        const trunk = h * 0.4, top = h;
        trunks.push({ x, z, y: trunk / 2, sx: spread * 0.16, sy: trunk, sz: spread * 0.16, top, color: new THREE.Color(0x80694d) });
        crowns.push({ x, z, y: trunk + h * 0.28, sx: spread, sy: h * 0.32, sz: spread * 0.9, top, color: new THREE.Color().setHSL(0.27 + index % 5 * 0.012, 0.3, 0.34 + index % 4 * 0.025) });
      };
      for (const parcel of parcels) {
        const x0 = cityX(parcel.x), x1 = cityX(parcel.x + parcel.w - 1) + pitch, z0 = cityZ(parcel.z), z1 = cityZ(parcel.z + parcel.d - 1) + pitch;
        const x = (x0 + x1) / 2 - width / 2, z = (z0 + z1) / 2 - depth / 2, w = (x1 - x0) * 0.78, d = (z1 - z0) * 0.78;
        const signature = parcel.x * 13 + parcel.z * 7 + parcel.year;
        if (parcel.kind === "grass") continue;
        if (parcel.kind === "shrub") {
          const h = pitch * 0.38, spread = Math.min(w, d) * 0.3;
          for (const offset of [-0.2, 0.2]) shrubs.push({ x: x + w * offset, z, y: h * 0.45, sx: spread, sy: h * 0.55, sz: spread, top: h, color: new THREE.Color(signature % 2 ? 0x78975b : 0x4f815e) });
          continue;
        }
        if (parcel.kind === "tree") { addTree(x, z, pitch * (1.1 + parcel.mean * 0.07) * Math.sqrt(parcel.w * parcel.d), Math.min(w, d) * 0.42, signature); continue; }
        const height = parcel.floors * floorHeight;
        const tint = new THREE.Color(yearTone(parcel.year));
        const brickColor = new THREE.Color([0xc99678, 0xd4b797, 0xb18c75][signature % 3]).lerp(tint, 0.18);
        const glassColor = new THREE.Color([0x88b3c8, 0x5e869d, 0xa3c2ca][signature % 3]).lerp(tint, 0.12);
        const limestone = new THREE.Color(0xe7dfca), roofColor = new THREE.Color(signature % 2 ? 0x727e83 : 0xb6b6aa);
        const h = parcel.form === "stadium" ? floorHeight * 2 : parcel.form === "hall" ? Math.min(height, floorHeight * 4) : height;
        const cap = parcel.form === "house" ? floorHeight * 0.9 : parcel.form === "hall" ? h * 0.5 : floorHeight * 0.28, target = h + cap;
        const part = (bucket: Placement[], color: THREE.Color, dx: number, y: number, dz: number, sx: number, sy: number, sz: number) => bucket.push({ x: x + dx, y, z: z + dz, sx, sy, sz, top: target, color });
        if (parcel.form === "house") {
          part(brick, brickColor, 0, h / 2, 0, w, h, d);
          part(gables, new THREE.Color(signature % 2 ? 0x9e6653 : 0x596c77), 0, h + cap / 2, 0, w * 1.06, cap, d * 1.06);
          if (step === 1) part(stone, limestone, 0, floorHeight * 0.45, d * 0.52, w * 0.7, floorHeight * 0.18, d * 0.18);
        } else if (parcel.form === "office") {
          part(brick, brickColor, 0, h * 0.12, 0, w, h * 0.24, d);
          part(glass, glassColor, -w * 0.16, h * 0.57, 0, w * 0.68, h * 0.86, d * 0.9);
          part(stone, limestone, w * 0.29, h * 0.36, d * 0.1, w * 0.38, h * 0.72, d * 0.72);
          part(roofs, roofColor, -w * 0.16, h + cap / 2, 0, w * 0.71, cap, d * 0.93);
          part(roofs, roofColor, w * 0.29, h * 0.72 + cap / 2, d * 0.1, w * 0.4, cap, d * 0.74);
        } else if (parcel.form === "tower") {
          part(stone, limestone, 0, h * 0.09, 0, w, h * 0.18, d);
          if (signature % 2) {
            part(roundTowers, glassColor, 0, h * 0.53, 0, w * 0.83, h * 0.94, d * 0.83);
            part(roundRoofs, roofColor, 0, h + cap / 2, 0, w * 0.85, cap, d * 0.85);
          } else {
            part(glass, glassColor, 0, h * 0.39, 0, w * 0.86, h * 0.78, d * 0.86);
            part(glass, glassColor.clone().lerp(limestone, 0.15), 0, h * 0.86, 0, w * 0.62, h * 0.28, d * 0.62);
            part(roofs, roofColor, 0, h + cap / 2, 0, w * 0.65, cap, d * 0.65);
          }
          if (step === 1) part(roofs, limestone, 0, h + cap * 0.65, 0, w * 0.22, cap * 0.7, d * 0.22);
        } else if (parcel.form === "hall") {
          part(glass, glassColor, 0, h * 0.4, 0, w, h * 0.8, d);
          part(vaults, new THREE.Color(0xc8d2d3), 0, h * 0.8 + cap / 2, 0, w * 1.04, cap, d * 1.04);
          part(stone, limestone, 0, h * 0.34, d * 0.54, w * 0.75, h * 0.12, d * 0.2);
        } else {
          part(stands, new THREE.Color(0xa7b7bd), 0, h * 0.35, 0, w, h * 0.7, d);
          part(stadiumRoofs, limestone, 0, h * 0.74, 0, w * 1.05, h * 0.18, d * 1.05);
          part(fields, new THREE.Color(0xffffff), 0, 0.04, 0, w * 0.65, 0.05, d * 0.61);
        }
      }
      // 公园树木保留为景观；其余地块植被才按贡献量分层。
      const parkStart = cityX(parkColumn) - width / 2 - parkWidth;
      for (let r = 0; r < rows; r += 2 * step) for (const offset of [0.16, 0.85]) addTree(parkStart + parkWidth * offset + Math.sin(r * 1.7) * 0.3, cityZ(r) - depth / 2 + pitch / 2, 2 + r % 5 * 0.12, 0.68, r);
      const wallMaterials = [0, 1, 2].map(style => { const m = ownMaterial(new THREE.MeshStandardMaterial({ map: step < 4 ? facadeMaps()[style] : null, roughness: style === 1 ? 0.45 : 0.87, metalness: style === 1 ? 0.18 : 0.02 })); grow(m, true); return m; });
      const solid = ownMaterial(new THREE.MeshStandardMaterial({ roughness: 0.85 })); grow(solid, true);
      const leafMaterial = ownMaterial(new THREE.MeshStandardMaterial({ roughness: 1 })); grow(leafMaterial, true);
      addInstances(new THREE.BoxGeometry(1, 1, 1), wallMaterials[0], brick); addInstances(new THREE.BoxGeometry(1, 1, 1), wallMaterials[1], glass); addInstances(new THREE.BoxGeometry(1, 1, 1), wallMaterials[2], stone);
      addInstances(new THREE.BoxGeometry(1, 1, 1), solid, roofs);
      const gable = new THREE.BufferGeometry();
      gable.setAttribute("position", new THREE.Float32BufferAttribute([-.5,-.5,-.5, .5,-.5,-.5, 0,.5,-.5, -.5,-.5,.5, .5,-.5,.5, 0,.5,.5],3));
      gable.setIndex([0,2,1,3,4,5,0,3,5,0,5,2,2,5,4,2,4,1,0,1,4,0,4,3]);
      const flatGable = gable.toNonIndexed(); gable.dispose(); flatGable.computeVertexNormals(); addInstances(flatGable, solid, gables);
      const arch = new THREE.Shape(); arch.moveTo(-.5,-.5); arch.quadraticCurveTo(0,1.5,.5,-.5); arch.lineTo(-.5,-.5);
      const vault = new THREE.ExtrudeGeometry(arch,{depth:1,bevelEnabled:false,curveSegments:8}); vault.translate(0,0,-.5); addInstances(vault, solid, vaults);
      const ringShape = new THREE.Shape(); ringShape.absellipse(0,0,.5,.5,0,Math.PI*2,false,0);
      const hole = new THREE.Path(); hole.absellipse(0,0,.34,.32,0,Math.PI*2,true,0); ringShape.holes.push(hole);
      const ring = new THREE.ExtrudeGeometry(ringShape,{depth:1,bevelEnabled:false,curveSegments:16}); ring.rotateX(-Math.PI/2); ring.translate(0,-.5,0);
      addInstances(ring.clone(), solid, stands); addInstances(ring, solid, stadiumRoofs);
      addInstances(new THREE.CylinderGeometry(.5,.5,1,12), wallMaterials[1], roundTowers); addInstances(new THREE.CylinderGeometry(.5,.5,1,12), solid, roundRoofs);
      if (fields.length) {
        const fieldMaterial = ownMaterial(new THREE.MeshStandardMaterial({ map: fieldMap(), roughness: 1 })); grow(fieldMaterial, true);
        addInstances(new THREE.BoxGeometry(1,1,1), fieldMaterial, fields);
      }
      addInstances(new THREE.BoxGeometry(1,1,1),solid,trunks); addInstances(new THREE.SphereGeometry(1,8,6),leafMaterial,crowns); addInstances(new THREE.SphereGeometry(1,7,5),leafMaterial,shrubs);
    } else {
      const positions: number[] = [], normals: number[] = [], uvs: number[] = [], indices: number[] = [], normal = new THREE.Vector3();
      const sample = (x: number, z: number) => {
        const c = THREE.MathUtils.clamp(Math.round(x - 0.5), 0, columns - 1), r = THREE.MathUtils.clamp(Math.round(z - 0.5), 0, rows - 1);
        return terrainHeights[Math.min(r * columns + c, days.length - 1)];
      };
      const heightAt = (x: number, z: number) => {
        const x0 = Math.floor(x / step) * step, z0 = Math.floor(z / step) * step, tx = (x - x0) / step, tz = (z - z0) / step;
        const h = THREE.MathUtils.lerp(THREE.MathUtils.lerp(sample(x0, z0), sample(x0 + step, z0), tx), THREE.MathUtils.lerp(sample(x0, z0 + step), sample(x0 + step, z0 + step), tx), tz);
        const nx = x / columns * 2 - 1, nz = z / rows * 2 - 1, edge = Math.pow(Math.abs(nx) ** 6 + Math.abs(nz) ** 6, 1 / 6);
        // 少量褶皱只调制数据高度场，不另造与贡献无关的山峰。
        const folds = 0.84 + 0.12 * (1 - Math.abs(Math.sin(nx * 17 + nz * 9 + Math.sin(nz * 11)))) + 0.04 * Math.sin(nx * 39 - nz * 28);
        return h * folds * (1 - THREE.MathUtils.smoothstep(edge + Math.sin(nx * 7 + nz * 4) * 0.025, 0.7, 1.02));
      };
      for (const group of groups) {
        const offset = positions.length / 3;
        for (const [x, z] of [[group.x, group.z], [group.x + group.w, group.z], [group.x + group.w, group.z + group.d], [group.x, group.z + group.d], [group.x + group.w / 2, group.z + group.d / 2]]) {
          const h = heightAt(x, z); heightLimit = Math.max(heightLimit, h);
          positions.push(x / columns * width - width / 2, h, z / rows * depth - depth / 2); uvs.push(x / columns, z / rows);
          normal.set((heightAt(x - 0.25, z) - heightAt(x + 0.25, z)) / (0.5 * width / columns), 1, (heightAt(x, z - 0.25) - heightAt(x, z + 0.25)) / (0.5 * depth / rows)).normalize(); normals.push(normal.x, normal.y, normal.z);
        }
        indices.push(offset, offset + 4, offset + 1, offset + 1, offset + 4, offset + 2, offset + 2, offset + 4, offset + 3, offset + 3, offset + 4, offset);
      }
      const geometry = new THREE.BufferGeometry(); geometries.add(geometry);
      altitudeScale.value = heightLimit;
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3)); geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3)); geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2)); geometry.setIndex(indices);
      const material = ownMaterial(new THREE.MeshStandardMaterial({ map: terrainMap(), roughness: 0.96, transparent: true, alphaTest: 0.02, depthWrite: false })); grow(material, false, true);
      const mesh = new THREE.Mesh(geometry, material); mesh.castShadow = true; mesh.receiveShadow = false; mesh.frustumCulled = false; mesh.renderOrder = 1;
      const depthMaterial = ownMaterial(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: terrainMap(), alphaTest: 0.3 })); grow(depthMaterial, false); mesh.customDepthMaterial = depthMaterial; root.add(mesh);
    }
    scene.add(root);
    return { heightLimit, dispose() { scene.remove(root); instances.forEach(mesh => mesh.dispose()); geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose()); root.clear(); } };
  }
  const camera = new THREE.OrthographicCamera(-20, 20, 12, -12, 0.1, distance * 6);
  let angle = 0.56, view = initialView, step = 0;
  let feature: ReturnType<typeof buildView> | undefined;
  const positionCamera = () => { camera.position.set(Math.sin(angle) * distance, distance * 0.72, Math.cos(angle) * distance); camera.lookAt(0, 2, 0); };
  positionCamera();
  let disposed = false, contextLost = false, raf = 0, playing = true, last = 0;
  const detail = () => `${view === "city" ? (step === 1 ? "0 草地 · 1–2 灌木 · 3–5 树木 · 6+ 建筑（每日贡献）" : "草地 / 灌木 / 树木 / 建筑 · 按组内日均贡献分层") : "连续山脉 · 颜色随当前高度变化"} · ${step === 1 ? "精细视图" : (view === "city" ? "宏观视图 · 同高地块可合并" : `宏观视图，最多 ${step * step} 日/组`)} · 整体生长`;
  const notify = () => onChange(timeline.getState(), undefined, detail());
  const updateDetail = (force = false) => {
    const pixels = host.clientHeight * (width / columns) * camera.zoom / (camera.top - camera.bottom), next = pixels >= 8 ? 1 : pixels >= 3.5 ? 2 : 4;
    if (next !== step || force) { feature?.dispose(); step = next; feature = buildView(view, step); }
    renderer.domElement.setAttribute("aria-label", `${view === "city" ? "城市街区" : "连续时光山脉"}。${detail()}。拖动旋转，滚轮缩放。`);
  };
  const schedule = () => { if (!disposed && !contextLost && !document.hidden && !raf) raf = requestAnimationFrame(tick); };
  function tick(now: number) {
    raf = 0; if (disposed || contextLost || document.hidden) return;
    if (playing) { if (!last) timeline.play(now); timeline.advance(now); last = now; playing = timeline.getState().status === "playing"; }
    const state = timeline.getState(), progress = state.revealedDays / state.totalDays;
    lift.value = (1 - Math.pow(1 - progress, 1.4)) * (feature?.heightLimit ?? 1);
    renderer.render(scene, camera); notify(); if (playing) schedule();
  }
  const resize = () => {
    const w = Math.max(host.clientWidth, 1), h = Math.max(host.clientHeight, 1), aspect = w / h;
    const half = Math.max(radius * 0.56 + 3, radius / aspect) * 1.02;
    camera.left = -half * aspect; camera.right = half * aspect; camera.top = half; camera.bottom = -half; camera.updateProjectionMatrix(); renderer.setSize(w, h, false); updateDetail(); schedule();
  };
  const observer = new ResizeObserver(resize); observer.observe(host);
  const colorPreference = matchMedia("(prefers-color-scheme: dark)");
  const updateTheme = () => {
    const mode = document.documentElement.getAttribute("data-color-mode"), preview = document.documentElement.getAttribute("data-preview-theme");
    const dark = preview === "dark" || (preview !== "light" && (mode === "dark" || (mode !== "light" && colorPreference.matches)));
    ambient.color.set(dark ? 0xb9cbee : 0xdce9f5); ambient.groundColor.set(dark ? 0x425b4a : 0x758368); ambient.intensity = dark ? 2.6 : 2.1;
    sun.color.set(dark ? 0xc6d8f2 : 0xffead1); sun.intensity = dark ? 1.8 : 3.1; schedule();
  };
  const themeObserver = new MutationObserver(updateTheme); themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-color-mode", "data-dark-theme", "data-light-theme", "data-preview-theme"] }); colorPreference.addEventListener("change", updateTheme);
  let pointer: number | undefined;
  const down = (event: PointerEvent) => { pointer = event.clientX; renderer.domElement.setPointerCapture(event.pointerId); };
  const move = (event: PointerEvent) => { if (pointer === undefined) return; angle += (event.clientX - pointer) * 0.008; pointer = event.clientX; positionCamera(); schedule(); };
  const up = () => { pointer = undefined; };
  const zoomBy = (factor: number) => { if (disposed || contextLost) return; camera.zoom = THREE.MathUtils.clamp(camera.zoom * factor, 0.5, 3.5); camera.updateProjectionMatrix(); updateDetail(); schedule(); };
  const wheel = (event: WheelEvent) => { event.preventDefault(); zoomBy(Math.exp(-event.deltaY * 0.001)); };
  const pause = () => { playing = false; timeline.pause(); last = 0; notify(); };
  const visibility = () => { if (document.hidden) { pause(); cancelAnimationFrame(raf); raf = 0; } else schedule(); };
  const lost = (event: Event) => { event.preventDefault(); contextLost = true; pause(); cancelAnimationFrame(raf); raf = 0; onChange(timeline.getState(), "图形上下文已中断，请重新生成风景。", detail()); };
  renderer.domElement.addEventListener("pointerdown", down); renderer.domElement.addEventListener("pointermove", move); renderer.domElement.addEventListener("pointerup", up); renderer.domElement.addEventListener("pointercancel", up);
  renderer.domElement.addEventListener("wheel", wheel, { passive: false }); renderer.domElement.addEventListener("webglcontextlost", lost); document.addEventListener("visibilitychange", visibility);
  resize(); updateTheme(); notify(); if (matchMedia("(prefers-reduced-motion: reduce)").matches) { playing = false; timeline.skip(); schedule(); }
  return {
    setView(next) { if (disposed || contextLost || next === view) return; view = next; updateDetail(true); schedule(); notify(); },
    zoomBy,
    pause,
    resume() { if (disposed || contextLost || timeline.getState().status === "completed") return; playing = true; last = 0; schedule(); },
    skip() { if (disposed || contextLost) return; playing = false; timeline.skip(); schedule(); notify(); },
    replay() { if (disposed || contextLost) return; timeline.replay(performance.now()); playing = true; last = 0; lift.value = 0; schedule(); notify(); },
    dispose() {
      if (disposed) return;
      disposed = true; playing = false; timeline.pause(); cancelAnimationFrame(raf); raf = 0; observer.disconnect(); themeObserver.disconnect(); colorPreference.removeEventListener("change", updateTheme); document.removeEventListener("visibilitychange", visibility);
      renderer.domElement.removeEventListener("pointerdown", down); renderer.domElement.removeEventListener("pointermove", move); renderer.domElement.removeEventListener("pointerup", up); renderer.domElement.removeEventListener("pointercancel", up);
      renderer.domElement.removeEventListener("wheel", wheel); renderer.domElement.removeEventListener("webglcontextlost", lost); feature?.dispose(); textures.forEach(map => map.dispose()); sun.shadow.dispose(); scene.clear(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    },
  };
}
