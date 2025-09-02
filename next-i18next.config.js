module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ku', 'ar'],
    localeDetection: false,
  },
  fallbackLng: {
    default: ['en'],
  },
  debug: false,
  reloadOnPrerender: process.env.NODE_ENV === 'development',
};