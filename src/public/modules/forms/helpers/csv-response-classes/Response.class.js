module.exports = class Response {
  constructor(responseData) {
    this._data = responseData
  }

  get id() {
    return this._data._id
  }

  /**
   * Gets the CSV header.
   * @returns {string}
   */
  get question() {
    return this._data.question
  }

  get isHeader() {
    return this._data.isHeader
  }
}
