const Response = require('./Response.class')

module.exports = class TableResponse extends Response {
  getAnswer(colIndex) {
    // Leave cell empty if number of rows is fewer than the index
    if (colIndex >= this._data.answerArray.length) {
      return ''
    }
    return this._data.answerArray[colIndex].join(';')
  }

  get numCols() {
    return this._data.answerArray.length
  }
}
