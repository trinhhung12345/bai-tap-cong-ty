module.exports = function (api) {
  api.cache(true);
  let plugins = [];

  // Thêm plugin module-resolver để hỗ trợ alias '' (see below for file content)...
  plugins.push([
    'module-resolver',
    {
      root: ['./src'],
      alias: {
        '@': './src',
        '@assets': './assets',
        '@components': './src/components',
        '@navigation': './src/navigation',
        '@screens': './src/screens',
        '@store': './src/store',
      },
    },
  ]);

  plugins.push('react-native-worklets/plugin');

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
