import type { WeeklyCity } from './city-parcels';

export const CITY_ROAD_WIDTH = .8;
export const CITY_YEAR_GAP = 1.6;
export const CITY_PARK_DEPTH = 4;
const QUARTER_COLUMNS = 14;
export const CITY_QUARTER_ROADS = [14, 28.8, 43.6] as const;
export const CITY_YEAR_WIDTH = QUARTER_COLUMNS * 4 + CITY_ROAD_WIDTH * 3;

export interface CityDistrictLayout {
  year: number; z: number; quarterWeeks: number[]; quarterPadding: number[];
  weekX(week: number): number;
}
export interface CityLayout { width: number; districts: CityDistrictLayout[] }

/** 只平移整周列；每季最多14列，余量并入路面，不缩放或补造日期。 */
export function createCityLayout(weekly: WeeklyCity): CityLayout {
  return { width: CITY_YEAR_WIDTH, districts: weekly.districts.map((district, block) => {
    const quarterWeeks = [3, 6, 9].map(month =>
      Math.round((Date.UTC(district.year, month, 1) - district.monday) / 604800000));
    const boundaries=[0,...quarterWeeks,district.weeks];
    return { year: district.year,
      z: Math.round((block * (7 + CITY_YEAR_GAP) + Math.floor(block / 5) * CITY_PARK_DEPTH) * 1000) / 1000,
      quarterWeeks,
      quarterPadding: boundaries.slice(1).map((end,index)=>QUARTER_COLUMNS-(end-boundaries[index])),
      weekX(week) {
        const quarter = quarterWeeks.filter(boundary => boundary <= week).length;
        return quarter * (QUARTER_COLUMNS + CITY_ROAD_WIDTH) + week - (quarter ? quarterWeeks[quarter - 1] : 0);
      },
    };
  }) };
}
