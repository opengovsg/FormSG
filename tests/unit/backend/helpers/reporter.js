const { SpecReporter } = require('jasmine-spec-reporter')
// remove default reporter logs
jasmine.getEnv().clearReporters()
// add jasmine-spec-reporter
jasmine.getEnv().addReporter(
  new SpecReporter({
    spec: {
      displayPending: true,
    },
  }),
)
