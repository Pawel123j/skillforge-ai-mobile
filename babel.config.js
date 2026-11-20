module.exports = function (api) {
  api.cache(true);
  // The `@/` alias comes from tsconfig.json "paths": Metro resolves it natively
  // (Expo SDK 50+) and Jest maps it in jest.config.cjs, so no Babel resolver
  // plugin is needed.
  return {
    presets: ['babel-preset-expo'],
  };
};
