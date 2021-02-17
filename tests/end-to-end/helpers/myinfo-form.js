const { makeField } = require('./util')

const myInfoFields = [
  {
    myInfo: { attr: 'name' },
    disabled: true,
    title: '[MyInfo] Name',
    val: 'TIMOTHY TAN CHENG GUAN',
  },
  {
    myInfo: { attr: 'sex' },
    disabled: true,
    title: '[MyInfo] Gender',
    val: 'MALE',
  },
  {
    myInfo: { attr: 'workpassstatus' },
    val: 'Live',
    title: 'Workpass status',
    fieldType: 'dropdown',
  },
].map(makeField)

module.exports = { myInfoFields }
