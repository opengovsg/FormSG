// Kept free of imports so the Storybook preview graph (via apps/frontend/src/i18n)
// can depend on these without pulling in form.ts, which changes often.

export enum Language {
  ENGLISH = 'en-SG',
  CHINESE = 'zh-SG',
  MALAY = 'ms-SG',
  TAMIL = 'ta-SG',
}

export enum FormResponseMode {
  Encrypt = 'encrypt',
  Email = 'email',
  Multirespondent = 'multirespondent',
}
