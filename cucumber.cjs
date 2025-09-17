const config = {
  requireModule: ['ts-node/register', 'tsconfig-paths/register'],
  import: ['features/step_definitions/**/*.ts'],
  format: ['@cucumber/pretty-formatter'],
  publishQuiet: true
}

module.exports = config
