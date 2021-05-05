/*
The inheritance hierachy is as follows:
                                Field
                              /      \
                      AnswerField   NoAnswerField (includes image, statement)
                  /               \
          ArrayAnswer            SingleAnswer (includes NRIC, Yes/No)
        /     |                       |
  Checkbox   Table      Attachment, Date, Dropdown, Header, Radio, Rating, Verifiable
                                                                              |
                                                                  (includes mobile, email)

*/

/**
 * Superclass for all fields.
 */
class Field {
  /**
   * Called to deserialise raw field object returned by backend.
   * @param {fieldData} fieldData Raw field data as in form.form_fields in
   * the form object returned by backend.
   */
  constructor(fieldData) {
    Object.assign(this, this.getDefaultBasicData(), fieldData)
  }

  getDefaultBasicData() {
    return {
      required: true,
      disabled: false,
    }
  }

  lock() {
    this.disabled = true
  }
}

module.exports = Field
