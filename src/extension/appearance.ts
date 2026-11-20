export type Appearance = 'city' | 'miniature';
export const APPEARANCE_KEY = 'codeyears:ui:appearance';

export function appearancePreference(value: unknown): Appearance {
  return value === 'miniature' ? 'miniature' : 'city';
}

export async function readAppearance(): Promise<Appearance> {
  try { return appearancePreference((await chrome.storage.local.get(APPEARANCE_KEY))[APPEARANCE_KEY]); }
  catch { return 'city'; }
}

export const saveAppearance = (appearance: Appearance) => chrome.storage.local.set({ [APPEARANCE_KEY]: appearance });
