const { makeField } = require('./util')
const fields = [
  {
    title: 'Yes/No',
    fieldType: 'yes_no',
    val: 'Yes',
  },
].map(makeField)
const logicData = [
  {
    conditions: [
      {
        fieldIndex: 0,
        value: 'Yes',
        state: 'is equals to',
        ifValueType: 'single-select',
      },
    ],
    logicType: 'preventSubmit',
    preventSubmitMessage: 'You shall not pass',
  },
]

module.exports = {
  fields,
  logicData,
  toastMessage: logicData[0].preventSubmitMessage,
}
