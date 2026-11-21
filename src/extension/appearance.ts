export type Appearance = 'native' | 'miniature';
export const APPEARANCE_KEY = 'codeyears:ui:appearance';
export const CITY_VISIBILITY_KEY = 'codeyears:ui:show-city';

export function appearancePreference(value: unknown): Appearance {
  return value === 'miniature' ? 'miniature' : 'native';
}

export const cityVisibilityPreference = (value: unknown) => value !== false;

export async function readAppearanceSettings(): Promise<{ appearance: Appearance; showCity: boolean }> {
  try {
    const values = await chrome.storage.local.get([APPEARANCE_KEY, CITY_VISIBILITY_KEY]);
    return {
      appearance: appearancePreference(values[APPEARANCE_KEY]),
      showCity: cityVisibilityPreference(values[CITY_VISIBILITY_KEY]),
    };
  } catch { return { appearance: 'native', showCity: true }; }
}

export const saveAppearance = (appearance: Appearance) => chrome.storage.local.set({ [APPEARANCE_KEY]: appearance });
export const saveCityVisibility = (showCity: boolean) => chrome.storage.local.set({ [CITY_VISIBILITY_KEY]: showCity });
