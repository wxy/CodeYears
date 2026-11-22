import type { WeeklyCity } from './city-parcels';
import bridgeLevels from './city-bridge-levels.json';

export const CITY_STREET_LANE_WIDTH = .6;
// 年度和季度地块的间隔包含路面和两侧种植带。
export const CITY_STREET_VERGE = .64;
export const CITY_ROAD_WIDTH = CITY_STREET_LANE_WIDTH * 2 + 2 * CITY_STREET_VERGE;
export const CITY_YEAR_GAP = CITY_STREET_LANE_WIDTH * 4 + 2 * CITY_STREET_VERGE;
// 河带含两岸大道的半幅、岸带和4格水面；桥身长度按基础落点确定。
export const CITY_PARK_DEPTH = 9.6 + 2 * CITY_STREET_VERGE;
export const CITY_BAND_YEARS = 5;
export const CITY_RIVER_DEPTH = bridgeLevels.riverDepth;
export const CITY_RIVER_BANK_DEPTH = 1.6;
const QUARTER_COLUMNS = 13;
export const CITY_QUARTER_ROADS = [13, 26 + CITY_ROAD_WIDTH, 39 + CITY_ROAD_WIDTH * 2] as const;
export const CITY_YEAR_WIDTH = QUARTER_COLUMNS * 4 + CITY_ROAD_WIDTH * 3;

export interface CityDistrictLayout {
  year: number; band: number; z: number; quarterWeeks: number[]; quarterPadding: number[];
  weekX(week: number): number;
}
export interface CityLayout { width: number; districts: CityDistrictLayout[]; bandStarts: number[] }

/** 每13个ISO周分段；只插入三条道路，53周归末段，短年末端余量并入路面。 */
export function createCityLayout(weekly: WeeklyCity, originYear = weekly.districts[0]?.year): CityLayout {
  const weeks = Math.max(0,...weekly.districts.map(district=>district.weeks));
  const bandStarts: number[] = [];
  let previousBand: number | undefined;
  const districts = weekly.districts.map((district, block) => {
    const band = Math.floor((district.year - (originYear ?? district.year)) / CITY_BAND_YEARS);
    if (block > 0 && band !== previousBand) bandStarts.push(block);
    previousBand = band;
    const quarterWeeks = [13,26,39];
    return { year: district.year, band,
      z: Math.round((block * (7 + CITY_YEAR_GAP) + bandStarts.length * CITY_PARK_DEPTH) * 1000) / 1000,
      quarterWeeks,
      quarterPadding: [0,0,0,weeks-district.weeks],
      weekX(week: number) {
        const quarter = quarterWeeks.filter(boundary => boundary <= week).length;
        return week + quarter * CITY_ROAD_WIDTH;
      },
    };
  });
  return { width: weeks + CITY_ROAD_WIDTH * 3, districts, bandStarts };
}
