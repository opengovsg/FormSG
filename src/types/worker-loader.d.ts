// Retrived from https://github.com/webpack-contrib/worker-loader
// Taken from the Integrating with Typescript section

// NOTE: Refer here: https://stackoverflow.com/questions/55487631/using-webworkers-in-typescript-with-webpack-and-worker-loader-without-custom-loa
// This is required to import without custom loaders
declare module '*.worker.ts' {
  // You need to change `Worker`, if you specified a different value for the `workerType` option
  class WebpackWorker extends Worker {
    constructor()
  }

  // Uncomment this if you set the `esModule` option to `false`
  // export = WebpackWorker;
  export default WebpackWorker
}
