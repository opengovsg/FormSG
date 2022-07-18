import tracer from 'dd-trace'

tracer.init()

// setup express to not track middlewares as spans
// see documentation: https://datadoghq.dev/dd-trace-js/interfaces/plugins.express.html
tracer.use('express', {
  middleware: false,
})

export default tracer
