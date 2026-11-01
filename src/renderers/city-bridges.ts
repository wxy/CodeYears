import { sampleCityBridge, type CityBridge } from './city-road-network';

/** 两端落在实际路口中心；季度轴不同时缓和过渡，桥头方向仍沿道路。 */
export function createCityBridgePainter(bridges: readonly CityBridge[]): (context: CanvasRenderingContext2D) => void {
  const paint: ((context: CanvasRenderingContext2D) => void)[] = [];
  for (const bridge of bridges) {
    const point = (t: number, offset: number, heightOffset = 0, ground = false): [number, number] => {
      const { x, z, elevation } = sampleCityBridge(bridge, t, offset);
      const height = (ground ? 0 : elevation) + heightOffset;
      return [(x - z) * .5, (x + z) * .25 - height * .5];
    };
    const times = [0, .125, .2, .375, .5, .625, .8, .875, 1];
    const fill = (points: readonly [number, number][], color: string) => {
      const path = new Path2D(); points.forEach((p, i) => i ? path.lineTo(...p) : path.moveTo(...p)); path.closePath();
      paint.push(context => { context.fillStyle = color; context.fill(path); });
    };
    const line = (points: readonly [number, number][], color: string, width: number) => {
      const path = new Path2D(); points.forEach((p, i) => i ? path.lineTo(...p) : path.moveTo(...p));
      paint.push(context => { context.lineJoin = 'round'; context.setLineDash([]); context.strokeStyle = color; context.lineWidth = width; context.stroke(path); });
    };
    const deck = (left: number, right: number, color: string, ground = false) => fill([
      ...times.map(t => point(t, left, 0, ground)), ...[...times].reverse().map(t => point(t, right, 0, ground)),
    ], color);
    deck(-.57, .64, 'rgba(47,75,73,.18)', true);
    // 水中支撑和桥身侧面位于抬升桥面下方。
    for (const t of [.35, .65]) {
      fill([point(t - .025, -.56, 0, true), point(t - .025, .56, 0, true), point(t + .025, .56), point(t + .025, -.56)], '#83958b');
    }
    fill([...times.map(t => point(t, .53, 0, true)), ...[...times].reverse().map(t => point(t, .53))], '#7a8b83');
    deck(-.53, .53, '#c1c5b7');
    deck(-.4, .4, '#626d68');
    for (const offset of [-.355, .355]) line(times.map(t => point(t, offset, .002)), '#e1dfd0', .013);
    // 双黄线在路口留空，接合的是道路中心而不是岸树空隙。
    for (const offset of [-.05, .05]) line([.23, .375, .5, .625, .77].map(t => point(t, offset, .003)), '#d6b96d', .014);
    for (const offset of [-.49, .49]) {
      line([.21, .375, .5, .625, .79].map(t => point(t, offset, .23)), '#dddccd', .018);
      for (let i = 0; i <= 6; i++) {
        const t = .21 + .58 * i / 6;
        line([point(t, offset), point(t, offset, .23)], '#a4b1a5', .018);
      }
      for (const t of [.25, .75]) {
        line([point(t, offset), point(t, offset, .35)], '#7d9083', .028);
        line([point(t, offset, .34), point(t, offset, .39)], '#dfcca0', .04);
      }
    }
  }
  return context => { for (const command of paint) command(context); };
}
