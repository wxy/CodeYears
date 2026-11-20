export type Appearance = 'native' | 'miniature';
export const APPEARANCE_KEY = 'codeyears:ui:appearance';

export function appearancePreference(value: unknown): Appearance {
  return value === 'miniature' ? 'miniature' : 'native';
}

export async function readAppearance(): Promise<Appearance> {
  try {
    const values = await chrome.storage.local.get(APPEARANCE_KEY);
    return appearancePreference(values[APPEARANCE_KEY]);
  } catch { return 'native'; }
}

export const saveAppearance = (appearance: Appearance) => chrome.storage.local.set({ [APPEARANCE_KEY]: appearance });
