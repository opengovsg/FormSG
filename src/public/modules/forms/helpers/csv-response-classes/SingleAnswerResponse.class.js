const Response = require('./Response.class')

module.exports = class SingleAnswerResponse extends Response {
  getAnswer() {
    return this._data.answer
  }

  get numCols() {
    return 1
  }
}
