import type { WeeklyCity } from './city-parcels';

export const CITY_ROAD_WIDTH = .8;
export const CITY_YEAR_GAP = 1.6;
export const CITY_PARK_DEPTH = 4;
const QUARTER_COLUMNS = 13;
export const CITY_QUARTER_ROADS = [13, 26.8, 40.6] as const;
export const CITY_YEAR_WIDTH = QUARTER_COLUMNS * 4 + CITY_ROAD_WIDTH * 3;

export interface CityDistrictLayout {
  year: number; z: number; quarterWeeks: number[]; quarterPadding: number[];
  weekX(week: number): number;
}
export interface CityLayout { width: number; districts: CityDistrictLayout[] }

/** 每13个ISO周分段；只插入三条道路，53周归末段，短年末端余量并入路面。 */
export function createCityLayout(weekly: WeeklyCity): CityLayout {
  const weeks = Math.max(0,...weekly.districts.map(district=>district.weeks));
  return { width: weeks + CITY_ROAD_WIDTH * 3, districts: weekly.districts.map((district, block) => {
    const quarterWeeks = [13,26,39];
    return { year: district.year,
      z: Math.round((block * (7 + CITY_YEAR_GAP) + Math.floor(block / 5) * CITY_PARK_DEPTH) * 1000) / 1000,
      quarterWeeks,
      quarterPadding: [0,0,0,weeks-district.weeks],
      weekX(week) {
        const quarter = quarterWeeks.filter(boundary => boundary <= week).length;
        return week + quarter * CITY_ROAD_WIDTH;
      },
    };
  }) };
}
