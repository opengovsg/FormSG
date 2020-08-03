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
    myInfo: { attr: 'vehno' },
    val: 'SKR1234R',
    title: 'Vehicle number',
    fieldType: 'textfield',
  },
].map(makeField)

module.exports = { myInfoFields }
