import * as THREE from "three";
import type { DailyContribution } from "../data/types";
import { createTimeline } from "../timeline/controller";
import type { TimelineState } from "../timeline/types";
import type { ViewMode } from "./types";

export interface ContributionLandscape {
  setView(view: ViewMode): void;
  zoomBy(factor: number): void;
  pause(): void;
  resume(): void;
  skip(): void;
  replay(): void;
  dispose(): void;
}

/** 连续贡献风景。空间聚合、平滑和塑形只用于表现，源日期/数量保持不变。 */
export function createLandscape(host: HTMLElement, days: readonly DailyContribution[], onChange: (state: TimelineState, error?: string, detail?: string) => void, initialView: ViewMode = "city"): ContributionLandscape {
  const columns = Math.ceil(Math.sqrt(days.length) * 1.3), rows = Math.ceil(days.length / columns), spacing = 1.2;
  const width = columns * spacing, depth = rows * spacing, radius = Math.hypot(width, depth) / 2;
  const raw = days.map(day => Math.log1p(day.count));
  // 平滑不包含缺失日期；年份边界没有空隙或单独底座。
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
  const valley = Math.min(...smooth), relief = Math.max(Math.max(...smooth) - valley, 0.01), terrainScale = radius * 0.22 + 3;
  const terrainHeights = smooth.map(value => Math.pow((value - valley) / relief, 1.35) * terrainScale);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setClearColor(0xdce7e8);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.cssText = "display:block;width:100%;height:100%;touch-action:none";
  host.append(renderer.domElement);
  const scene = new THREE.Scene(), distance = radius * 3 + 30;
  scene.fog = new THREE.Fog(0xdce7e8, distance * 0.8, distance * 2.1);
  scene.add(new THREE.HemisphereLight(0xdce9f5, 0x6c725f, 2));
  const sun = new THREE.DirectionalLight(0xffead1, 3.2);
  sun.position.set(-radius * 0.6, radius * 1.4 + 20, radius * 0.7);
  sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.normalBias = 0.15; sun.shadow.bias = -0.0005;
  const shadow = sun.shadow.camera;
  shadow.left = shadow.bottom = -radius * 1.2; shadow.right = shadow.top = radius * 1.2;
  shadow.near = 1; shadow.far = radius * 5 + 100; shadow.updateProjectionMatrix(); scene.add(sun);

  const textures: THREE.Texture[] = [];
  const texture = (canvas: HTMLCanvasElement) => {
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4); textures.push(map); return map;
  };
  const facade = document.createElement("canvas"); facade.width = 128; facade.height = 256;
  const face = facade.getContext("2d")!;
  face.fillStyle = "#deded6"; face.fillRect(0, 0, 128, 256);
  for (let row = 0; row < 12; row++) for (let column = 0; column < 6; column++) {
    face.fillStyle = (row * 7 + column) % 11 === 0 ? "#c9bc96" : "#475d69";
    face.fillRect(column * 21 + 5, row * 21 + 5, 11, 13);
    face.fillStyle = "#a9b7b9"; face.fillRect(column * 21 + 5, row * 21 + 5, 11, 2);
  }
  const facadeMap = texture(facade);
  const grain = document.createElement("canvas"); grain.width = grain.height = 128;
  const grainContext = grain.getContext("2d")!, image = grainContext.createImageData(128, 128);
  let grainSeed = 739391;
  for (let i = 0; i < image.data.length; i += 4) {
    grainSeed ^= grainSeed << 13; grainSeed ^= grainSeed >>> 17; grainSeed ^= grainSeed << 5;
    const value = 208 + (grainSeed >>> 0) % 48;
    image.data[i] = image.data[i + 1] = image.data[i + 2] = value; image.data[i + 3] = 255;
  }
  grainContext.putImageData(image, 0, 0);
  const grainMap = texture(grain); grainMap.wrapS = grainMap.wrapT = THREE.RepeatWrapping;
  const streets = document.createElement("canvas"); streets.width = streets.height = 1024;
  const road = streets.getContext("2d")!, cellX = 1024 / columns, cellY = 1024 / rows;
  road.fillStyle = "#596365"; road.fillRect(0, 0, 1024, 1024);
  days.forEach((_, index) => {
    road.fillStyle = "#b2b5a9";
    road.fillRect(index % columns * cellX + cellX * 0.12, Math.floor(index / columns) * cellY + cellY * 0.12, cellX * 0.76, cellY * 0.76);
  });
  road.strokeStyle = "#d5d3bc"; road.lineWidth = 1; road.setLineDash([3, 4]);
  for (let c = 8; c < columns; c += 8) { road.beginPath(); road.moveTo(c * cellX, 0); road.lineTo(c * cellX, 1024); road.stroke(); }
  for (let r = 8; r < rows; r += 8) { road.beginPath(); road.moveTo(0, r * cellY); road.lineTo(1024, r * cellY); road.stroke(); }
  const streetMap = texture(streets); streetMap.flipY = false;
  const floorGeometry = new THREE.PlaneGeometry(Math.max(width, depth) * 8, Math.max(width, depth) * 8);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xaebba8, roughness: 1 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.12; floor.receiveShadow = true; scene.add(floor);
  const timeline = createTimeline(days.length), growth = { value: 0 }, growthDays = Math.max(3, days.length * 0.018);
  // 表面与阴影使用相同的生长位移；没有额外的常驻动画循环。
  function grow(material: THREE.Material, city: boolean) {
    material.onBeforeCompile = shader => {
      shader.uniforms.uDays = growth;
      shader.vertexShader = "attribute float endDay; uniform float uDays;\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>\nfloat rise = smoothstep(0.0, ${growthDays.toFixed(3)}, uDays - endDay);\n${city ? "transformed.y = (transformed.y + 0.5) * rise - 0.5;" : "transformed.y *= rise;"}`);
    };
    material.customProgramCacheKey = () => `codeyears-growth-${city}-${growthDays}`;
  }
  type Group = { x: number; z: number; w: number; d: number; end: number; count: number; mean: number };
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
  function buildView(mode: ViewMode, step: number) {
    const groups = groupsFor(step), ends = groups.map(group => group.end);
    let mesh: THREE.Mesh;
    const materials: THREE.Material[] = [];
    let reveal: (count: number) => void;
    let ground: THREE.Mesh | undefined;
    if (mode === "city") {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      geometry.setAttribute("endDay", new THREE.InstancedBufferAttribute(new Float32Array(ends), 1));
      const wall = new THREE.MeshStandardMaterial({ map: step === 1 ? facadeMap : null, roughness: 0.82 });
      const roof = new THREE.MeshStandardMaterial({ color: 0xd9dedd, roughness: 0.95 });
      materials.push(wall, roof); materials.forEach(material => grow(material, true));
      const buildings = new THREE.InstancedMesh(geometry, [wall, wall, roof, roof, wall, wall], groups.length);
      const matrix = new THREE.Matrix4(), color = new THREE.Color();
      groups.forEach((group, index) => {
        const height = group.count === 0 ? 0.045 : 0.25 + Math.log1p(group.mean) * 2.4;
        const variation = 0.7 + ((group.end * 16807) % 17) / 100;
        matrix.makeScale(group.w * spacing * variation, height, group.d * spacing * (0.73 + ((group.end * 7) % 13) / 100));
        matrix.setPosition((group.x + group.w / 2) * spacing - width / 2, height / 2, (group.z + group.d / 2) * spacing - depth / 2);
        buildings.setMatrixAt(index, matrix);
        if (group.count === 0) color.set(0x68865a);
        else color.setHSL(0.1 + ((group.end * 13) % 5) * 0.02, 0.045, 0.67 + ((group.end * 17) % 9) * 0.02);
        buildings.setColorAt(index, color);
      });
      buildings.instanceMatrix.needsUpdate = true; buildings.count = 0; mesh = buildings;
      const plane = new THREE.PlaneGeometry(width, depth), material = new THREE.MeshStandardMaterial({ map: streetMap, roughness: 0.96 });
      ground = new THREE.Mesh(plane, material); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.025; ground.receiveShadow = true; scene.add(ground);
      reveal = count => { buildings.count = count; };
    } else {
      const positions: number[] = [], normals: number[] = [], colors: number[] = [], uvs: number[] = [], indices: number[] = [], births: number[] = [];
      const low = new THREE.Color(0x60714c), middle = new THREE.Color(0x89906a), high = new THREE.Color(0xb3b0a0), color = new THREE.Color(), normal = new THREE.Vector3();
      const sample = (x: number, z: number) => {
        const c = THREE.MathUtils.clamp(Math.round(x - 0.5), 0, columns - 1), r = THREE.MathUtils.clamp(Math.round(z - 0.5), 0, rows - 1);
        return terrainHeights[Math.min(r * columns + c, days.length - 1)];
      };
      const heightAt = (x: number, z: number) => {
        const x0 = Math.floor(x / step) * step, z0 = Math.floor(z / step) * step, tx = (x - x0) / step, tz = (z - z0) / step;
        const h = THREE.MathUtils.lerp(THREE.MathUtils.lerp(sample(x0, z0), sample(x0 + step, z0), tx), THREE.MathUtils.lerp(sample(x0, z0 + step), sample(x0 + step, z0 + step), tx), tz);
        return h * THREE.MathUtils.smoothstep(Math.min(x, z, columns - x, rows - z), 0, Math.min(columns, rows) * 0.15);
      };
      for (const group of groups) {
        const offset = positions.length / 3;
        for (const [x, z] of [[group.x, group.z], [group.x + group.w, group.z], [group.x + group.w, group.z + group.d], [group.x, group.z + group.d], [group.x + group.w / 2, group.z + group.d / 2]]) {
          const height = heightAt(x, z), normalized = height / terrainScale;
          positions.push(x * spacing - width / 2, height, z * spacing - depth / 2); uvs.push(x / 4, z / 4); births.push(group.end);
          normal.set((heightAt(x - 0.25, z) - heightAt(x + 0.25, z)) / (0.5 * spacing), 1, (heightAt(x, z - 0.25) - heightAt(x, z + 0.25)) / (0.5 * spacing)).normalize(); normals.push(normal.x, normal.y, normal.z);
          if (normalized < 0.55) color.lerpColors(low, middle, normalized / 0.55); else color.lerpColors(middle, high, (normalized - 0.55) / 0.45);
          colors.push(color.r, color.g, color.b);
        }
        indices.push(offset, offset + 4, offset + 1, offset + 1, offset + 4, offset + 2, offset + 2, offset + 4, offset + 3, offset + 3, offset + 4, offset);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3)); geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3)); geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
      geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2)); geometry.setAttribute("endDay", new THREE.Float32BufferAttribute(births, 1));
      geometry.setIndex(indices); geometry.setDrawRange(0, 0);
      const material = new THREE.MeshStandardMaterial({ vertexColors: true, map: grainMap, roughness: 0.96 }); grow(material, false); materials.push(material);
      mesh = new THREE.Mesh(geometry, material); reveal = count => { geometry.setDrawRange(0, count * 12); };
    }
    const depthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }); grow(depthMaterial, mode === "city");
    mesh.customDepthMaterial = depthMaterial; mesh.castShadow = mesh.receiveShadow = true; mesh.frustumCulled = false; scene.add(mesh);
    return {
      reveal(daysCount: number) {
        let low = 0, high = ends.length;
        while (low < high) { const middle = (low + high) >>> 1; if (ends[middle] <= daysCount) low = middle + 1; else high = middle; }
        reveal(low);
      },
      dispose() {
        scene.remove(mesh); if (mesh instanceof THREE.InstancedMesh) mesh.dispose(); mesh.geometry.dispose(); materials.forEach(material => material.dispose()); depthMaterial.dispose();
        if (ground) { scene.remove(ground); ground.geometry.dispose(); (ground.material as THREE.Material).dispose(); }
      },
    };
  }
  const camera = new THREE.OrthographicCamera(-20, 20, 12, -12, 0.1, distance * 6);
  let angle = 0.56, view = initialView, step = 0;
  let feature: ReturnType<typeof buildView> | undefined;
  const positionCamera = () => { camera.position.set(Math.sin(angle) * distance, distance * 0.7, Math.cos(angle) * distance); camera.lookAt(0, 2, 0); };
  positionCamera();
  let disposed = false, contextLost = false, raf = 0, playing = true, last = 0;
  const detail = () => step === 1 ? (view === "city" ? "逐日地块 · 放大查看建筑细节" : "精细地形 · 平滑贡献强度") : `宏观景观 · 每组最多 ${step * step} 天 · ${view === "city" ? "高度按组内日均贡献" : "平滑贡献强度"} · 原始总量不变`;
  const notify = () => onChange(timeline.getState(), undefined, detail());
  const updateDetail = (force = false) => {
    const pixels = host.clientHeight * spacing * camera.zoom / (camera.top - camera.bottom);
    const next = pixels >= 8 ? 1 : pixels >= 3.5 ? 2 : 4;
    if (next !== step || force) { feature?.dispose(); step = next; feature = buildView(view, step); feature.reveal(timeline.getState().revealedDays); }
    floorMaterial.color.set(view === "city" ? 0xaebba8 : 0x6e795c);
    renderer.domElement.setAttribute("aria-label", `${view === "city" ? "连续贡献之城" : "连续时光山脉"}。${detail()}。拖动旋转，滚轮缩放。`);
  };
  const schedule = () => { if (!disposed && !contextLost && !document.hidden && !raf) raf = requestAnimationFrame(tick); };
  function tick(now: number) {
    raf = 0; if (disposed || contextLost || document.hidden) return;
    if (playing) { if (!last) timeline.play(now); timeline.advance(now); last = now; playing = timeline.getState().status === "playing"; }
    const state = timeline.getState(); growth.value = state.revealedDays + (state.status === "completed" ? growthDays : 0); feature?.reveal(state.revealedDays);
    renderer.render(scene, camera); notify(); if (playing) schedule();
  }
  const resize = () => {
    const w = Math.max(host.clientWidth, 1), h = Math.max(host.clientHeight, 1), aspect = w / h;
    const half = Math.max(radius * 0.58 + 4, radius / aspect) * 1.05;
    camera.left = -half * aspect; camera.right = half * aspect; camera.top = half; camera.bottom = -half; camera.updateProjectionMatrix();
    renderer.setSize(w, h, false); updateDetail(); schedule();
  };
  const observer = new ResizeObserver(resize); observer.observe(host);
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
  resize(); notify(); if (matchMedia("(prefers-reduced-motion: reduce)").matches) { playing = false; timeline.skip(); schedule(); }
  return {
    setView(next) { if (disposed || contextLost || next === view) return; view = next; updateDetail(true); schedule(); notify(); },
    zoomBy,
    pause,
    resume() { if (disposed || contextLost || timeline.getState().status === "completed") return; playing = true; last = 0; schedule(); },
    skip() { if (disposed || contextLost) return; playing = false; timeline.skip(); schedule(); notify(); },
    replay() { if (disposed || contextLost) return; timeline.replay(performance.now()); playing = true; last = 0; feature?.reveal(0); schedule(); notify(); },
    dispose() {
      if (disposed) return;
      disposed = true; playing = false; timeline.pause(); cancelAnimationFrame(raf); raf = 0; observer.disconnect(); document.removeEventListener("visibilitychange", visibility);
      renderer.domElement.removeEventListener("pointerdown", down); renderer.domElement.removeEventListener("pointermove", move); renderer.domElement.removeEventListener("pointerup", up); renderer.domElement.removeEventListener("pointercancel", up);
      renderer.domElement.removeEventListener("wheel", wheel); renderer.domElement.removeEventListener("webglcontextlost", lost);
      feature?.dispose(); floorGeometry.dispose(); floorMaterial.dispose(); textures.forEach(map => map.dispose()); sun.shadow.dispose(); scene.clear(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    },
  };
}
