export type CityVehicleKind = 'sedan' | 'suv' | 'van' | 'bus';
export interface CityVehicle {
  x: number; z: number; angle: number; kind: CityVehicleKind; color: string; elevation?: number;
}

type Point = [number, number, number];
interface Face { path: Path2D; color: string; shade: string; depth: number }

/** 世界坐标路径只准备一次；调用方负责路网、配色及稳定布车，paint 复用当前变换。 */
export function createCityVehiclePainter(vehicles: readonly CityVehicle[]): (context: CanvasRenderingContext2D) => void {
  const models = vehicles.map(vehicle => {
    const { x, z, angle, color, kind, elevation = 0 } = vehicle;
    const c = Math.cos(angle), s = Math.sin(angle), faces: Face[] = [], wheels: Face[] = [];
    const [length, width, roof] = kind === 'sedan' ? [.55, .25, .155]
      : kind === 'suv' ? [.62, .27, .19] : kind === 'van' ? [.72, .27, .215] : [1, .28, .23];
    const half = length / 2, side = width / 2, belt = .095, bottom = .04;
    const front = kind === 'sedan' ? half * .52 : half * .82;
    const rear = -half * (kind === 'sedan' ? .64 : .92);
    const roofFront = front - (kind === 'sedan' ? .075 : .035);
    const roofRear = rear + (kind === 'sedan' ? .045 : .018);
    const roofSide = side - .018, frontFacing = c + s, sideFacing = c - s;
    const world = ([u, v, h]: Point): Point => [x + c * u - s * v, z + s * u + c * v, elevation + h];
    const face = (points: Point[], fill: string, shade = 0) => {
      const path = new Path2D(); let depth = 0;
      points.forEach((point, i) => {
        const [wx, wz, h] = world(point), px = .5 * (wx - wz), py = .25 * (wx + wz) - .5 * h;
        if (i) path.lineTo(px, py); else path.moveTo(px, py);
        depth += wx + wz + h;
      });
      path.closePath(); const prepared = { path, color: fill,
        shade: shade > 0 ? `rgba(17,29,35,${shade})` : shade < 0 ? `rgba(236,239,223,${-shade})` : '',
        depth: depth / points.length };
      faces.push(prepared); return prepared;
    };
    const quad = (u1: number, u2: number, v: number, h1: number, h2: number, fill: string) =>
      face([[u1,v,h1],[u2,v,h1],[u2,v,h2],[u1,v,h2]], fill);

    // 紧凑接触阴影随桥面抬升；没有地面投影或动态光源计算。
    face([[-half-.015,-side-.008,.002],[half+.015,-side-.008,.002],
      [half+.015,side+.008,.002],[-half-.015,side+.008,.002]], '#18262a', 0);
    const shadow = faces.pop()!;
    // 底盘、车身顶面及朝向镜头的两个侧面。
    const bodyTop = face([[-half,-side,belt],[half,-side,belt],[half,side,belt],[-half,side,belt]], color, -.12);
    for (const sign of [-1, 1]) {
      if (sign * sideFacing > 1e-8) {
        face([[-half,sign*side,bottom],[half,sign*side,bottom],
          [half,sign*side,belt],[-half,sign*side,belt]], color, .24);
        quad(-half+.025, half-.025, sign*(side+.001), bottom, bottom+.014, '#374448');
      }
      if (sign * frontFacing > 1e-8) {
        const u = sign * half;
        face([[u,-side,bottom],[u,side,bottom],[u,side,belt],[u,-side,belt]], color, .12);
        face([[u+sign*.001,-side+.025,.042],[u+sign*.001,side-.025,.042],
          [u+sign*.001,side-.025,.054],[u+sign*.001,-side+.025,.054]], '#485356');
        for (const v of [-side+.037, side-.037]) {
          face([[u+sign*.002,v-.021,.066],[u+sign*.002,v+.021,.066],
            [u+sign*.002,v+.021,.084],[u+sign*.002,v-.021,.084]], sign > 0 ? '#e8d9ab' : '#b86559');
        }
      }
    }
    // 轿车斜背、SUV 高顶、厢车封闭货舱、巴士长排车窗。
    face([[roofRear,-roofSide,roof],[roofFront,-roofSide,roof],
      [roofFront,roofSide,roof],[roofRear,roofSide,roof]], color, -.18);
    for (const sign of [-1, 1]) {
      if (sign * sideFacing * (roof-belt) + side-roofSide > 1e-8) {
        const v = sign * side, rv = sign * roofSide;
        const panel = face([[rear,v,belt],[front,v,belt],[roofFront,rv,roof],[roofRear,rv,roof]], color, .18);
        // 收顶侧面在车身顶面之上，低矮斜背也不能被顶面的平均深度盖回。
        panel.depth = Math.max(panel.depth, bodyTop.depth + .00001);
        const windows = kind === 'bus' ? 5 : kind === 'van' ? 1 : 2;
        const start = kind === 'van' ? front - .16 : rear + .025;
        const end = front - .02, step = (end-start) / windows;
        for (let i = 0; i < windows; i++) {
          const a = start+i*step+.009, b = start+(i+1)*step-.009;
          const inset = .018, topA = a + (roofRear-rear) * .7, topB = b - (front-roofFront) * .7;
          face([[a,v+sign*.001,belt+inset],[b,v+sign*.001,belt+inset],
            [topB,rv+sign*.001,roof-.014],[topA,rv+sign*.001,roof-.014]], '#435e68').depth = panel.depth + .00001;
        }
        // 门把手/货舱压线用面片，不为远景堆叠细小描边。
        quad(front-.09, front-.045, v+sign*.002, belt-.005, belt+.002, '#c1c7bd').depth = panel.depth + .00001;
        if (kind === 'van') quad(rear+.055, rear+.063, v+sign*.002, belt+.018, roof-.03, '#53616a').depth = panel.depth + .00001;
      }
      const u = sign > 0 ? front : rear, ru = sign > 0 ? roofFront : roofRear;
      if (sign * frontFacing * (roof-belt) + Math.abs(u-ru) > 1e-8) {
        const panel = face([[u,-side,belt],[u,side,belt],[ru,roofSide,roof],[ru,-roofSide,roof]], color, .06);
        const lowU = u+(ru-u)*.18, highU = u+(ru-u)*.84;
        face([[lowU,-side+.021,belt+(roof-belt)*.18],[lowU,side-.021,belt+(roof-belt)*.18],
          [highU,roofSide-.013,belt+(roof-belt)*.84],[highU,-roofSide+.013,belt+(roof-belt)*.84]], '#496873').depth = panel.depth + .00001;
      }
    }
    // 车轮是侧面竖直圆盘，按相同投影采样；轮毂仅保留一层。
    const axle = half * (kind === 'bus' ? .7 : .65), radius = kind === 'bus' ? .039 : .034;
    for (const sign of [-1, 1]) if (sign * sideFacing > 1e-8) {
      for (const u of [-axle, axle]) for (const [r, fill] of [[radius, '#253135'], [radius*.45, '#9ca9a6']] as const) {
        const points: Point[] = [];
        for (let i = 0; i < 12; i++) {
          const a = i / 12 * Math.PI * 2;
          points.push([u+Math.cos(a)*r, sign*(side+.003+(r<radius?.001:0)), radius+Math.sin(a)*r]);
        }
        wheels.push(face(points, fill)); faces.pop();
      }
    }
    faces.sort((a, b) => a.depth - b.depth);
    // 可见轮胎在车身侧面外，整组置后，避免后轮被面的平均深度误遮挡。
    faces.push(...wheels);
    return { depth: x+z, shadow: shadow.path, faces };
  });
  models.sort((a, b) => a.depth - b.depth);
  return context => {
    context.save();
    for (const model of models) {
      context.fillStyle = 'rgba(20,34,38,.16)'; context.fill(model.shadow);
      for (const { path, color, shade } of model.faces) {
        context.fillStyle = color; context.fill(path);
        if (shade) {
          context.fillStyle = shade;
          context.fill(path);
        }
      }
    }
    context.restore();
  };
}
