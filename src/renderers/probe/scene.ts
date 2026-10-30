import * as THREE from 'three';
import type { DailyContribution } from '../../data/types';
export function createScene(host: HTMLElement, days: readonly DailyContribution[], mode: 'city' | 'terrain', natural: boolean) {
  const started = performance.now();
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(natural ? 0xe8ede5 : 0x101827);
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  let angle = 0.6, distance = 180;
  const geometry = mode === 'city' ? new THREE.BoxGeometry(0.8, 1, 0.8) : new THREE.PlaneGeometry(89, 81, 89, 81);
  const material = new THREE.MeshNormalMaterial({ wireframe: false, side: THREE.DoubleSide });
  const city = mode === 'city' ? new THREE.InstancedMesh(geometry, material, days.length) : null;
  const terrain = city ? null : new THREE.Mesh(geometry, material);
  if (city) { city.frustumCulled = false; scene.add(city); }
  if (terrain) { terrain.rotation.x = -Math.PI / 2; terrain.frustumCulled = false; scene.add(terrain); }
  const matrix = new THREE.Matrix4();
  const heights = days.map(day => Math.log1p(day.count) * 3);
  if (city) {
    for (let i = 0; i < days.length; i++) {
      const height = Math.max(0.05, heights[i]!);
      matrix.makeScale(1, height, 1); matrix.setPosition(i % 90 - 44.5, height / 2, Math.floor(i / 90) - 40.5);
      city.setMatrixAt(i, matrix);
    }
    city.instanceMatrix.needsUpdate = true;
  }
  let disposed = false, raf = 0, playing = true, visibleDays = 0, last = 0;
  let frames = 0, updates = 0, updateMs = 0, renderMs = 0;
  const intervals: number[] = [];
  const setGeometry = () => {
    const start = performance.now();
    if (city) {
      city.count = visibleDays;
    } else {
      const position = geometry.getAttribute('position');
      for (let i = 0; i < position.count; i++) position.setZ(i, i < visibleDays ? heights[i] ?? 0 : 0);
      position.needsUpdate = true; geometry.computeVertexNormals();
    }
    updates++; updateMs += performance.now() - start;
  };
  const draw = () => {
    const start = performance.now(); renderer.render(scene, camera); renderMs += performance.now() - start; frames++;
  };
  const schedule = () => { if (!disposed && !contextLost && !document.hidden && !raf) raf = requestAnimationFrame(tick); };
  const tick = (time: number) => {
    raf = 0;
    if (disposed || contextLost || document.hidden) return;
    if (playing && visibleDays < days.length) {
      if (last) intervals.push(time - last);
      visibleDays = Math.min(days.length, visibleDays + (last ? Math.max(0, time - last) : 0) * days.length / 8000);
      last = time;
      const fractional = visibleDays; visibleDays = Math.floor(visibleDays); setGeometry(); visibleDays = fractional;
      if (visibleDays === days.length) playing = false;
    }
    draw(); if (playing) schedule();
  };
  const positionCamera = () => { camera.position.set(Math.sin(angle) * distance, distance * 0.8, Math.cos(angle) * distance); camera.lookAt(0, 0, 0); };
  const resize = () => { const width = Math.max(host.clientWidth, 1), height = Math.max(host.clientHeight, 1); renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix(); schedule(); };
  const visibility = () => { cancelAnimationFrame(raf); raf = 0; last = 0; if (!document.hidden) schedule(); };
  const wheel = (event: WheelEvent) => { event.preventDefault(); distance = THREE.MathUtils.clamp(distance + event.deltaY * 0.1, 80, 300); positionCamera(); schedule(); };
  let pointer: number | null = null;
  const down = (event: PointerEvent) => { pointer = event.clientX; renderer.domElement.setPointerCapture(event.pointerId); };
  const move = (event: PointerEvent) => { if (pointer === null) return; angle += (event.clientX - pointer) * 0.01; pointer = event.clientX; positionCamera(); schedule(); };
  const up = () => { pointer = null; };
  let contextLost = false;
  const lost = (event: Event) => { event.preventDefault(); contextLost = true; playing = false; cancelAnimationFrame(raf); raf = 0; };
  renderer.domElement.addEventListener('webglcontextlost', lost);
  renderer.domElement.addEventListener('wheel', wheel, { passive: false });
  renderer.domElement.addEventListener('pointerdown', down); renderer.domElement.addEventListener('pointermove', move); renderer.domElement.addEventListener('pointerup', up); renderer.domElement.addEventListener('pointercancel', up);
  document.addEventListener('visibilitychange', visibility);
  const observer = new ResizeObserver(resize); observer.observe(host);
  positionCamera(); setGeometry(); resize();
  const info = () => ({ mode, vertices: geometry.getAttribute('position').count, capacity: days.length, frames, visibleDays: Math.floor(visibleDays), playing, hidden: document.hidden, pendingFrame: !!raf, contextLost, disposed, geometryBuilds: 1, updates, updateMs, renderMs,
    frameIntervalP50: percentile(0.5), frameIntervalP95: percentile(0.95), samples: intervals.length,
    calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures, programs: renderer.info.programs?.length ?? 0 });
  function percentile(fraction: number) { const sorted = [...intervals].sort((a, b) => a - b); return sorted[Math.floor((sorted.length - 1) * fraction)] ?? null; }
  const setupMs = performance.now() - started;
  return {
    snapshot: () => ({ ...info(), setupMs }),
    pause() { if (!playing) return; playing = false; last = 0; },
    resume() { if (disposed || contextLost || visibleDays >= days.length) return; playing = true; last = 0; schedule(); },
    skip() { if (disposed || contextLost) return; playing = false; last = 0; visibleDays = days.length; setGeometry(); schedule(); },
    dispose() {
      if (disposed) return;
      disposed = true; playing = false; cancelAnimationFrame(raf); raf = 0; observer.disconnect(); document.removeEventListener('visibilitychange', visibility);
      renderer.domElement.removeEventListener('wheel', wheel); renderer.domElement.removeEventListener('pointerdown', down); renderer.domElement.removeEventListener('pointermove', move); renderer.domElement.removeEventListener('pointerup', up); renderer.domElement.removeEventListener('pointercancel', up); renderer.domElement.removeEventListener('webglcontextlost', lost);
      city?.dispose(); scene.clear(); geometry.dispose(); material.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    }
  };
}
