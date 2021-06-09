/**
 * These interfaces provide common functions across different subclasses
 * of the Field hierarchy.
 */

/**
 * Fields which allow setting of a maximum and a minimum, but not an exact
 * value. Currently includes Checkbox (can choose between min-max value)
 * and Decimal (can choose a value between min-max).
 * @param {Class} Base Class being extended
 */
const RangeValidation = (Base) =>
  class extends Base {
    getDefaultBasicData() {
      const fieldData = super.getDefaultBasicData()
      fieldData.ValidationOptions = {
        customMax: null,
        customMin: null,
      }
      fieldData.validateByValue = false
      return fieldData
    }
  }

/**
 * Fields which allow setting of a maximum, minimum or exact number number
 * of characters. Currently includes Number, TextArea and TextField.
 * @param {Class} Base Class being extended
 */
const CustomValidation = (Base) =>
  class extends Base {
    getDefaultBasicData() {
      const fieldData = super.getDefaultBasicData()
      fieldData.ValidationOptions = {
        customVal: null,
        selectedValidation: null,
      }
      return fieldData
    }
  }

module.exports = {
  RangeValidation,
  CustomValidation,
}
