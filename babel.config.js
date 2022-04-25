/**
 */
const compile = (esmodule) => ({
  presets: [
    [
      '@babel/preset-env',
      {
        modules: esmodule ? false : 'commonjs',
        useBuiltIns: false,
        targets: 'ios_saf >= 10, chrome >= 49',
      },
    ],
  ],
})

module.exports = {
  env: {
    commonjs: compile(false),
    esmodule: compile(true),
  },
}
