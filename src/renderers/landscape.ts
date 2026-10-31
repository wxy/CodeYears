import * as THREE from "three";
import type { DailyContribution } from "../data/types";
import { createTimeline } from "../timeline/controller";
import type { TimelineState } from "../timeline/types";
import type { ViewMode } from "./types";

export interface ContributionLandscape {
  setView(view: ViewMode): void;
  pause(): void;
  resume(): void;
  skip(): void;
  replay(): void;
  dispose(): void;
}

/** 仅消费可信日期/数量；分年布局、高度及地形插值不改动原始数据。 */
export function createLandscape(host: HTMLElement, days: readonly DailyContribution[], onChange: (state: TimelineState, error?: string) => void, initialView: ViewMode = "city"): ContributionLandscape {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0xeef4f2);
  renderer.domElement.style.cssText = "display:block;width:100%;height:100%;touch-action:none";
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x81948a, 2.4));
  const light = new THREE.DirectionalLight(0xfffaf0, 3.1);
  light.position.set(-25, 45, 20);
  scene.add(light);

  // 每年固定 20×19 个日期位置，缺失/未来日期不生成建筑或地形面。
  const districts: { year: number; start: number; length: number; x: number; z: number }[] = [];
  days.forEach((day, index) => {
    const year = Number(day.date.slice(0, 4));
    if (districts.at(-1)?.year !== year) districts.push({ year, start: index, length: 0, x: 0, z: 0 });
    districts.at(-1)!.length++;
  });
  const columns = Math.ceil(Math.sqrt(districts.length));
  const rows = Math.ceil(districts.length / columns);
  const axis = (index: number) => index + Math.floor(index / 5) * 0.4;
  const heights = days.map(day => day.count === 0 ? 0.04 : 0.3 + Math.log1p(day.count) * 1.35);
  const baseGeometry = new THREE.BoxGeometry(23.2, 0.3, 25);
  const baseMaterial = new THREE.MeshStandardMaterial({ color: 0xdce7df, roughness: 0.96 });
  const bases = new THREE.InstancedMesh(baseGeometry, baseMaterial, districts.length);
  const matrix = new THREE.Matrix4();
  const labelTextures: THREE.CanvasTexture[] = [];
  const labelMaterials: THREE.SpriteMaterial[] = [];
  const yearLabels: THREE.Sprite[] = [];
  districts.forEach((district, index) => {
    district.x = (index % columns - (columns - 1) / 2) * 27;
    district.z = (Math.floor(index / columns) - (rows - 1) / 2) * 29;
    matrix.makeTranslation(district.x, -0.19, district.z);
    bases.setMatrixAt(index, matrix);
    const label = document.createElement("canvas");
    label.width = 256; label.height = 80;
    const context = label.getContext("2d")!;
    context.font = '500 42px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    context.textAlign = "center"; context.textBaseline = "middle"; context.fillStyle = "#496256";
    context.fillText(String(district.year), 128, 40);
    const texture = new THREE.CanvasTexture(label);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.SpriteMaterial({ map: texture, depthWrite: false, depthTest: false });
    const sprite = new THREE.Sprite(material);
    sprite.renderOrder = 1;
    sprite.position.set(district.x, 0.3, district.z + 11.8);
    sprite.scale.set(5.5, 1.72, 1);
    scene.add(sprite); yearLabels.push(sprite); labelTextures.push(texture); labelMaterials.push(material);
  });
  bases.instanceMatrix.needsUpdate = true;
  scene.add(bases);

  function buildView(mode: ViewMode) {
    const material = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0.02, vertexColors: mode === "terrain" });
    let mesh: THREE.Mesh;
    let reveal: (count: number) => void;
    if (mode === "city") {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const buildings = new THREE.InstancedMesh(geometry, material, days.length);
      const color = new THREE.Color();
      districts.forEach((district, districtIndex) => {
        for (let local = 0; local < district.length; local++) {
          const index = district.start + local, count = days[index].count;
          const footprint = count === 0 ? 0.74 : 0.66 + Math.min(Math.log1p(count) * 0.035, 0.18);
          matrix.makeScale(footprint, heights[index], footprint);
          matrix.setPosition(district.x + axis(local % 20) - axis(19) / 2, heights[index] / 2, district.z + axis(Math.floor(local / 20)) - axis(18) / 2 - 1);
          buildings.setMatrixAt(index, matrix);
          if (count === 0) color.set(0xc3d7cb);
          else color.setHSL(0.44 + (districtIndex % 3) * 0.018, 0.3, 0.38 + Math.min(Math.log1p(count) * 0.04, 0.2));
          buildings.setColorAt(index, color);
        }
      });
      buildings.instanceMatrix.needsUpdate = true;
      buildings.count = 0;
      mesh = buildings;
      reveal = count => { buildings.count = count; };
    } else {
      const positions: number[] = [], colors: number[] = [], indices: number[] = [];
      const low = new THREE.Color(0x3e7e69), high = new THREE.Color(0xd7cdb0), color = new THREE.Color();
      const vertex = (x: number, height: number, z: number) => {
        positions.push(x, height, z);
        color.lerpColors(low, high, Math.min(height / 8, 1));
        colors.push(color.r, color.g, color.b);
      };
      const boundary = (index: number, count: number) => index === 0 ? -0.5 : index === count ? axis(count - 1) + 0.5 : (axis(index - 1) + axis(index)) / 2;
      for (const district of districts) {
        const offset = positions.length / 3;
        // 相邻日期只在公共角点做视觉插值，每日中心仍取该日的真实数量映射。
        for (let row = 0; row <= 19; row++) for (let column = 0; column <= 20; column++) {
          let sum = 0, neighbors = 0;
          for (const r of [row - 1, row]) for (const c of [column - 1, column]) {
            const local = r * 20 + c;
            if (r >= 0 && r < 19 && c >= 0 && c < 20 && local < district.length) { sum += heights[district.start + local]; neighbors++; }
          }
          vertex(district.x + boundary(column, 20) - axis(19) / 2, neighbors ? sum / neighbors : 0, district.z + boundary(row, 19) - axis(18) / 2 - 1);
        }
        for (let local = 0; local < district.length; local++) {
          const row = Math.floor(local / 20), column = local % 20, center = positions.length / 3;
          vertex(district.x + axis(column) - axis(19) / 2, heights[district.start + local], district.z + axis(row) - axis(18) / 2 - 1);
          const a = offset + row * 21 + column, b = a + 1, d = a + 21, c = d + 1;
          indices.push(a, center, b, b, center, c, c, center, d, d, center, a);
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
      geometry.setIndex(indices); geometry.computeVertexNormals(); geometry.setDrawRange(0, 0);
      mesh = new THREE.Mesh(geometry, material);
      reveal = count => { geometry.setDrawRange(0, count * 12); };
    }
    mesh.frustumCulled = false;
    scene.add(mesh);
    return { reveal, dispose() { scene.remove(mesh); if (mesh instanceof THREE.InstancedMesh) mesh.dispose(); mesh.geometry.dispose(); material.dispose(); } };
  }
  let view = initialView;
  let feature = buildView(view);
  const labelView = () => renderer.domElement.setAttribute("aria-label", `${view === "city" ? "贡献之城" : "时光山脉"}。按年份分区，可拖动旋转、滚轮缩放。`);
  labelView();
  const camera = new THREE.OrthographicCamera(-20, 20, 12, -12, 0.1, 2000);
  const radius = Math.hypot((columns - 1) * 27 + 23.2, (rows - 1) * 29 + 25) / 2;
  const maxHeight = Math.max(...heights);
  const distance = radius * 3 + 30;
  let angle = 0.58;
  const positionCamera = () => {
    camera.position.set(Math.sin(angle) * distance, distance * 0.8, Math.cos(angle) * distance);
    camera.lookAt(0, 1, 0);
  };
  positionCamera();
  const timeline = createTimeline(days.length);
  let disposed = false, contextLost = false, raf = 0, playing = true, last = 0;
  const notify = () => onChange(timeline.getState());
  const sizeLabels = () => {
    // 年份保持约 13 CSS 像素的字高，长历史和缩放后仍可辨认。
    const height = 24 * (camera.top - camera.bottom) / camera.zoom / Math.max(host.clientHeight, 1);
    yearLabels.forEach(label => label.scale.set(height * 3.2, height, 1));
  };
  const schedule = () => { if (!disposed && !contextLost && !document.hidden && !raf) raf = requestAnimationFrame(tick); };
  function tick(now: number) {
    raf = 0;
    if (disposed || contextLost || document.hidden) return;
    if (playing) {
      if (!last) timeline.play(now);
      timeline.advance(now); last = now;
      playing = timeline.getState().status === "playing";
    }
    feature.reveal(timeline.getState().revealedDays);
    renderer.render(scene, camera); notify();
    if (playing) schedule();
  }
  const resize = () => {
    const width = Math.max(host.clientWidth, 1), height = Math.max(host.clientHeight, 1), aspect = width / height;
    const half = Math.max(radius * 0.65 + maxHeight * 0.6, radius / aspect) * 1.08;
    camera.left = -half * aspect; camera.right = half * aspect; camera.top = half; camera.bottom = -half;
    camera.updateProjectionMatrix(); renderer.setSize(width, height, false); sizeLabels(); schedule();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  let pointer: number | undefined;
  const down = (event: PointerEvent) => { pointer = event.clientX; renderer.domElement.setPointerCapture(event.pointerId); };
  const move = (event: PointerEvent) => { if (pointer === undefined) return; angle += (event.clientX - pointer) * 0.008; pointer = event.clientX; positionCamera(); schedule(); };
  const up = () => { pointer = undefined; };
  const wheel = (event: WheelEvent) => { event.preventDefault(); camera.zoom = THREE.MathUtils.clamp(camera.zoom * Math.exp(-event.deltaY * 0.001), 0.6, 2.5); camera.updateProjectionMatrix(); sizeLabels(); schedule(); };
  const pause = () => { playing = false; timeline.pause(); last = 0; notify(); };
  const visibility = () => { if (document.hidden) { pause(); cancelAnimationFrame(raf); raf = 0; } else schedule(); };
  const lost = (event: Event) => { event.preventDefault(); contextLost = true; pause(); cancelAnimationFrame(raf); raf = 0; onChange(timeline.getState(), "图形上下文已中断，请重新生成风景。"); };
  renderer.domElement.addEventListener("pointerdown", down); renderer.domElement.addEventListener("pointermove", move);
  renderer.domElement.addEventListener("pointerup", up); renderer.domElement.addEventListener("pointercancel", up);
  renderer.domElement.addEventListener("wheel", wheel, { passive: false }); renderer.domElement.addEventListener("webglcontextlost", lost);
  document.addEventListener("visibilitychange", visibility);
  resize(); notify();
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { playing = false; timeline.skip(); schedule(); }
  return {
    setView(next) {
      if (disposed || contextLost || next === view) return;
      feature.dispose(); view = next; feature = buildView(view);
      feature.reveal(timeline.getState().revealedDays); labelView(); schedule(); notify();
    },
    pause,
    resume() { if (disposed || contextLost || timeline.getState().status === "completed") return; playing = true; last = 0; schedule(); },
    skip() { if (disposed || contextLost) return; playing = false; timeline.skip(); schedule(); notify(); },
    replay() { if (disposed || contextLost) return; timeline.replay(performance.now()); playing = true; last = 0; feature.reveal(0); schedule(); notify(); },
    dispose() {
      if (disposed) return;
      disposed = true; playing = false; timeline.pause(); cancelAnimationFrame(raf); raf = 0;
      observer.disconnect(); document.removeEventListener("visibilitychange", visibility);
      renderer.domElement.removeEventListener("pointerdown", down); renderer.domElement.removeEventListener("pointermove", move);
      renderer.domElement.removeEventListener("pointerup", up); renderer.domElement.removeEventListener("pointercancel", up);
      renderer.domElement.removeEventListener("wheel", wheel); renderer.domElement.removeEventListener("webglcontextlost", lost);
      feature.dispose(); bases.dispose(); baseGeometry.dispose(); baseMaterial.dispose();
      labelTextures.forEach(texture => texture.dispose()); labelMaterials.forEach(material => material.dispose()); scene.clear();
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    },
  };
}
