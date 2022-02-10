const { makeField } = require('./util')
const fields = [
  {
    title: 'Number',
    fieldType: 'number',
    val: '10',
  },
  {
    title: 'Favourite Food',
    fieldType: 'dropdown',
    fieldOptions: ['Rice', 'Chocolate', 'Ice-Cream'],
    val: 'Chocolate',
  },
  {
    title: 'Yes/No',
    fieldType: 'yes_no',
    val: 'Yes',
  },
].map(makeField)
const logicData = [
  {
    showFieldIndices: [1],
    conditions: [
      {
        fieldIndex: 0,
        state: 'is more than or equal to',
        value: '10',
        ifValueType: 'number',
      },
    ],
    logicType: 'showFields',
  },
  {
    showFieldIndices: [2],
    conditions: [
      {
        fieldIndex: 1,
        state: 'is either',
        value: ['Rice', 'Chocolate'],
        ifValueType: 'multi-select',
      },
    ],
    logicType: 'showFields',
  },
  {
    conditions: [
      {
        fieldIndex: 2,
        state: 'is equals to',
        value: 'Yes',
        ifValueType: 'single-select',
      },
    ],
    logicType: 'preventSubmit',
    preventSubmitMessage: 'Bring me a shrubbery',
  },
]
module.exports = {
  fields,
  logicData,
  toastMessage: logicData[2].preventSubmitMessage,
}
