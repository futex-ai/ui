module.exports = function (api) {
  api.cache(true);
  // `babel-preset-expo` auto-configures the reanimated/worklets plugin when
  // reanimated is installed, so it does not need to be listed manually.
  return {
    presets: ["babel-preset-expo"],
  };
};
