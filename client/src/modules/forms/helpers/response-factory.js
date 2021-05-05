const {
  SingleAnswerResponse,
  ArrayAnswerResponse,
  TableResponse,
} = require('./csv-response-classes')

const getResponseInstance = (fieldRecordData) => {
  switch (fieldRecordData.fieldType) {
    case 'table':
      return new TableResponse(fieldRecordData)
    case 'checkbox':
      return new ArrayAnswerResponse(fieldRecordData)
    default:
      return new SingleAnswerResponse(fieldRecordData)
  }
}

module.exports = { getResponseInstance }
