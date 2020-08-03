'use strict'

/**
 * NOTICE
 *
 * This is a modified fork of the node-byline library, available at
 * https://github.com/jahewson/node-byline
 *
 * To improve its performance parsing newline-delimited JSON from the server
 * for decrypting form submissions, significant changes have been made:
 *
 * - The stream is assumed to be ASCII-encoded instead of UTF-8. This works because
 * encrypted content is in Base 64 and results in much faster Buffer -> String conversion.
 *
 * - The line break character is directly assumed to be '\n' to avoid expensive
 * regular expressions. Characters such as '\r\n' or other Unicode
 * characters will not work.
 *
 * Last updated 30 Sep 2019
 * Yuanruo Liang
 */

const stream = require('stream')
const util = require('util')
const timers = require('timers')

// convenience API
module.exports = function (readStream, options) {
  return module.exports.createStream(readStream, options)
}

// basic API
module.exports.createStream = function (readStream, options) {
  if (readStream) {
    return createLineStream(readStream, options)
  } else {
    return new LineStream(options)
  }
}

// deprecated API
module.exports.createLineStream = function (readStream) {
  console.warn(
    'WARNING: byline#createLineStream is deprecated and will be removed soon',
  )
  return createLineStream(readStream)
}

function createLineStream(readStream, options) {
  if (!readStream) {
    throw new Error('expected readStream')
  }
  if (!readStream.readable) {
    throw new Error('readStream must be readable')
  }
  let ls = new LineStream(options)
  readStream.pipe(ls)
  return ls
}

//
// using the new node v0.10 "streams2" API
//

module.exports.LineStream = LineStream

function LineStream(options) {
  stream.Transform.call(this, options)
  options = options || {}

  // use objectMode to stop the output from being buffered
  // which re-concatanates the lines, just without newlines.
  this._readableState.objectMode = true
  this._lineBuffer = []
  this._keepEmptyLines = options.keepEmptyLines || false

  // take the source's encoding if we don't have one
  let self = this
  this.on('pipe', function (src) {
    if (!self.encoding) {
      // but we can't do this for old-style streams
      if (src instanceof stream.Readable) {
        self.encoding = src._readableState.encoding
      }
    }
  })
}
util.inherits(LineStream, stream.Transform)

LineStream.prototype._transform = function (chunk, encoding, done) {
  // decode binary chunks as ascii
  encoding = 'ascii'
  chunk = chunk.toString(encoding)

  this._chunkEncoding = encoding

  let lines = chunk.split('\n')

  if (this._lineBuffer.length > 0) {
    this._lineBuffer[this._lineBuffer.length - 1] += lines[0]
    lines.shift()
  }

  this._lineBuffer = this._lineBuffer.concat(lines)
  this._pushBuffer(encoding, 1, done)
}

LineStream.prototype._pushBuffer = function (encoding, keep, done) {
  // always buffer the last (possibly partial) line
  while (this._lineBuffer.length > keep) {
    let line = this._lineBuffer.shift()
    // skip empty lines
    if (this._keepEmptyLines || line.length > 0) {
      if (!this.push(this._reencode(line, encoding))) {
        // when the high-water mark is reached, defer pushes until the next tick
        let self = this
        timers.setImmediate(function () {
          self._pushBuffer(encoding, keep, done)
        })
        return
      }
    }
  }
  done()
}

LineStream.prototype._flush = function (done) {
  this._pushBuffer(this._chunkEncoding, 0, done)
}

// see Readable::push
LineStream.prototype._reencode = function (line, _chunkEncoding) {
  return line
}
