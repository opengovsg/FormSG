const DropdownField = require('./DropdownField.class')
const myInfoCountries = require('shared/constants/field/myinfo/myinfo-countries')

/**
 * Field class for field.fieldType === 'country'.
 */
class CountryField extends DropdownField {
  getDefaultBasicData() {
    const fieldData = super.getDefaultBasicData()
    fieldData.fieldOptionsFromText = myInfoCountries.join('\n')
    fieldData.fieldOptions = fieldData.fieldOptionsFromText.split('\n')
    return fieldData
  }
}

module.exports = CountryField
