export type Appearance = 'city' | 'miniature' | 'off';
export const APPEARANCE_KEY = 'codeyears:ui:appearance';
export const ROADS_KEY = 'codeyears:ui:miniature-roads';

export function appearancePreference(value: unknown): Appearance {
  return value === 'miniature' || value === 'off' ? value : 'city';
}

export const roadsPreference = (value: unknown) => value !== false;

export async function readAppearanceSettings(): Promise<{ appearance: Appearance; roads: boolean }> {
  try {
    const values = await chrome.storage.local.get([APPEARANCE_KEY, ROADS_KEY]);
    return { appearance: appearancePreference(values[APPEARANCE_KEY]), roads: roadsPreference(values[ROADS_KEY]) };
  } catch { return { appearance: 'city', roads: true }; }
}

export const saveAppearance = (appearance: Appearance) => chrome.storage.local.set({ [APPEARANCE_KEY]: appearance });
export const saveRoads = (roads: boolean) => chrome.storage.local.set({ [ROADS_KEY]: roads });
