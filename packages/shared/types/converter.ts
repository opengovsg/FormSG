export interface MyInfoDataTransformer<T, U> {
  /**
   * NRIC/FIN.
   */
  getUinFin(): string

  /**
   * Formats the MyInfo information to a string.
   */
  _formatFieldValue(attr: T): string | undefined

  /**
   * Determine if frontend should lock the field to prevent it from being
   * editable. The field is locked if it is government-verified and if it
   * does not contain marriage-related information (decision by SNDGO & MSF due to
   * overseas unregistered marriages).
   *
   * @param attr The field/attribute name directly obtained from the MyInfo
   *    information source.
   * @param fieldValue FormSG field value.
   */
  _isDataReadOnly(attr: T, fieldValue: string | undefined): boolean

  /**
   * Retrieves the fieldValue for the givern internal
   * MyInfo-compatible attribute.
   * @param attr Internal FormSG MyInfo attribute.
   */
  getFieldValueForAttr(attr: U): {
    fieldValue: string | undefined
    isReadOnly: boolean
  }
}
