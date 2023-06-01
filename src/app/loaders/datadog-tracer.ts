import tracer from 'dd-trace'

tracer.init({
  logInjection: true, // https://docs.datadoghq.com/tracing/other_telemetry/connect_logs_and_traces/nodejs/
  runtimeMetrics: true, // https://datadoghq.dev/dd-trace-js/interfaces/traceroptions.html#runtimemetrics
})

// setup express to not track middlewares as spans
// see documentation: https://datadoghq.dev/dd-trace-js/interfaces/plugins.express.html
tracer.use('express', {
  middleware: false,
})

export default tracer
