import * as THREE from "three";
import type { DailyContribution } from "../data/types";
import { createTimeline } from "../timeline/controller";
import type { TimelineState } from "../timeline/types";

export interface CityPreview {
  pause(): void;
  resume(): void;
  skip(): void;
  replay(): void;
  dispose(): void;
}

/** 已校验的真实日期/数量进入场景；数量映射仅改变高度，不修改来源。 */
export function createCityPreview(host: HTMLElement, days: readonly DailyContribution[], onChange: (state: TimelineState, error?: string) => void): CityPreview {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0xeef4f2);
  renderer.domElement.setAttribute("aria-label", "贡献之城。可拖动旋转、滚轮缩放。");
  renderer.domElement.style.cssText = "display:block;width:100%;height:100%;touch-action:none";
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x829c92, 2.6));
  const light = new THREE.DirectionalLight(0xffffff, 3.2);
  light.position.set(-20, 40, 25);
  scene.add(light);

  const columns = Math.ceil(Math.sqrt(days.length) * 1.35);
  const rows = Math.ceil(days.length / columns);
  const geometry = new THREE.BoxGeometry(0.78, 1, 0.78);
  const material = new THREE.MeshStandardMaterial({ roughness: 0.72, metalness: 0.06 });
  const city = new THREE.InstancedMesh(geometry, material, days.length);
  city.frustumCulled = false;
  const matrix = new THREE.Matrix4();
  const color = new THREE.Color();
  days.forEach((day, index) => {
    const height = day.count === 0 ? 0.035 : 0.25 + Math.log1p(day.count) * 1.7;
    matrix.makeScale(1, height, 1);
    matrix.setPosition(index % columns - (columns - 1) / 2, height / 2, Math.floor(index / columns) - (rows - 1) / 2);
    city.setMatrixAt(index, matrix);
    color.set(day.count === 0 ? 0xcbded6 : 0x268f80);
    if (day.count > 0) color.offsetHSL(0, 0, Math.min(Math.log1p(day.count) * 0.025, 0.15));
    city.setColorAt(index, color);
  });
  city.instanceMatrix.needsUpdate = true;
  city.count = 0;
  scene.add(city);
  const groundGeometry = new THREE.BoxGeometry(columns + 1, 0.25, rows + 1);
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xdce8e2, roughness: 0.95 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.position.y = -0.17;
  scene.add(ground);
  const camera = new THREE.OrthographicCamera(-20, 20, 12, -12, 0.1, 1000);
  let angle = 0.75;
  const positionCamera = () => {
    camera.position.set(Math.sin(angle) * 60, 42, Math.cos(angle) * 60);
    camera.lookAt(0, 1.5, 0);
  };
  positionCamera();
  const timeline = createTimeline(days.length);
  let disposed = false, contextLost = false, raf = 0, playing = true, last = 0;
  const notify = () => onChange(timeline.getState());
  const schedule = () => {
    if (!disposed && !contextLost && !document.hidden && !raf) raf = requestAnimationFrame(tick);
  };
  function tick(now: number) {
    raf = 0;
    if (disposed || contextLost || document.hidden) return;
    if (playing) {
      if (!last) timeline.play(now);
      timeline.advance(now);
      last = now;
      playing = timeline.getState().status === "playing";
    }
    city.count = timeline.getState().revealedDays;
    renderer.render(scene, camera);
    notify();
    if (playing) schedule();
  }
  const resize = () => {
    const width = Math.max(host.clientWidth, 1), height = Math.max(host.clientHeight, 1);
    const aspect = width / height;
    const half = Math.max(10, Math.max(columns, rows) * 0.72 / aspect);
    camera.left = -half * aspect; camera.right = half * aspect;
    camera.top = half; camera.bottom = -half;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    schedule();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  let pointer: number | undefined;
  const down = (event: PointerEvent) => { pointer = event.clientX; renderer.domElement.setPointerCapture(event.pointerId); };
  const move = (event: PointerEvent) => {
    if (pointer === undefined) return;
    angle += (event.clientX - pointer) * 0.008; pointer = event.clientX;
    positionCamera(); schedule();
  };
  const up = () => { pointer = undefined; };
  const wheel = (event: WheelEvent) => {
    event.preventDefault();
    camera.zoom = THREE.MathUtils.clamp(camera.zoom * Math.exp(-event.deltaY * 0.001), 0.6, 2.5);
    camera.updateProjectionMatrix(); schedule();
  };
  const pause = () => { playing = false; timeline.pause(); last = 0; notify(); };
  const visibility = () => { if (document.hidden) { pause(); cancelAnimationFrame(raf); raf = 0; } else schedule(); };
  const lost = (event: Event) => { event.preventDefault(); contextLost = true; pause(); cancelAnimationFrame(raf); raf = 0; onChange(timeline.getState(), "图形上下文已中断，请重新生成贡献之城。"); };
  renderer.domElement.addEventListener("pointerdown", down);
  renderer.domElement.addEventListener("pointermove", move);
  renderer.domElement.addEventListener("pointerup", up);
  renderer.domElement.addEventListener("pointercancel", up);
  renderer.domElement.addEventListener("wheel", wheel, { passive: false });
  renderer.domElement.addEventListener("webglcontextlost", lost);
  document.addEventListener("visibilitychange", visibility);
  resize(); notify();
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { playing = false; timeline.skip(); schedule(); }
  return {
    pause,
    resume() { if (disposed || contextLost || timeline.getState().status === "completed") return; playing = true; last = 0; schedule(); },
    skip() { if (disposed || contextLost) return; playing = false; timeline.skip(); schedule(); notify(); },
    replay() { if (disposed || contextLost) return; timeline.replay(performance.now()); playing = true; last = 0; city.count = 0; schedule(); notify(); },
    dispose() {
      if (disposed) return;
      disposed = true; playing = false; timeline.pause(); cancelAnimationFrame(raf); raf = 0;
      observer.disconnect(); document.removeEventListener("visibilitychange", visibility);
      renderer.domElement.removeEventListener("pointerdown", down);
      renderer.domElement.removeEventListener("pointermove", move);
      renderer.domElement.removeEventListener("pointerup", up);
      renderer.domElement.removeEventListener("pointercancel", up);
      renderer.domElement.removeEventListener("wheel", wheel);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      city.dispose(); scene.clear(); geometry.dispose(); material.dispose(); groundGeometry.dispose(); groundMaterial.dispose();
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    },
  };
}
