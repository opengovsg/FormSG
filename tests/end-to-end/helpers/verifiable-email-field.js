// Exports data for just verifiable email field
const { makeField } = require('./util')
const verifiableEmailFieldInfo = [
  {
    title: 'Personal Email',
    fieldType: 'email',
    isVerifiable: true,
    val: 'test@test.gov.sg',
  },
]
const verifiableEmailField = verifiableEmailFieldInfo.map(makeField)
module.exports = { verifiableEmailField }
