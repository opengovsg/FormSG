const Response = require('./Response.class')

module.exports = class ArrayAnswerResponse extends Response {
  getAnswer() {
    return this._data.answerArray.join(';')
  }

  get numCols() {
    return 1
  }
}
