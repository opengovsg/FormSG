// Internal type definitions for bson-ext basically re-exporting bson's own types.
// Definitions retrieved from https://www.npmjs.com/package/@types/bson and
// typed to follow bson-ext's exports.
/// <reference types="node"/>

declare module 'bson-ext' {
  export * from 'bson'
}
