export const defaultLanguageSettings: {[k: string]: {codes: string[]}} = {
  "Japanese": {
    codes: ["ja-JP"],
  },
  "Cantonese": {
    codes: ["yue-Hant-HK", "zh-HK"]
  },
  "English": {
    codes: ["en-US"]
  },
};

export type LanguageSetting = typeof defaultLanguageSettings['Japanese'];
export type LanguageSettings = {[k: string]: LanguageSetting};

export const defaultPronunciationOverrides = {} as { [k: string]: string };
export type PronunciationOverrides = typeof defaultPronunciationOverrides;

export const defaultByLangPronunciationOverrides = {} as { [k: string]: PronunciationOverrides };
export type ByLangPronunciationOverrides = typeof defaultByLangPronunciationOverrides;

export const newSession = {
  accessToken: "",
  login: "",
  sessionExpiresAt: 0,
  syncCursor: "",
};

export type Session = typeof newSession;

export const newSettings = {
  pronounce: defaultByLangPronunciationOverrides,
  session: newSession
};

export type Settings = typeof newSettings;
