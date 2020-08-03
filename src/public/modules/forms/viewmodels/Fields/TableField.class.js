const ArrayAnswerField = require('./ArrayAnswerField.class')
const { DropdownField, TextField } = require('.')

/**
 * Field class for field.fieldType === 'table'.
 * A note on the implementation on TableField: this.columns is a _specification_
 * for each column, whereas this.components is a ROWWISE 2D array of child components
 * which implement the specifications of this.columns, i.e. this.components[0][1] is
 * a Field instance at row 0, column 1. this.columns gets saved to the database, while
 * this.components is used only for rendering.
 */
class TableField extends ArrayAnswerField {
  constructor(fieldData) {
    super(fieldData)
    // Counter to ensure that ID of each component is unique
    this._counter = 0
    this.render()
  }

  /**
   * Creates all child components from scratch.
   */
  render() {
    // Rowwise 2D array of components
    this.components = []
    const colFieldData = this.columns.map(this._getFieldData, this)
    const colFieldClasses = this.columns.map(this._getChildClass)
    for (let i = 0; i < this.minimumRows; i++) {
      this.addRow(false, colFieldData, colFieldClasses)
    }
  }

  /**
   * Adds one row of components to the end of the table.
   * @param {boolean} isAdditional Whether the new row is additional, i.e. not
   * part of the minimum.
   * @param {Object} [colFieldData] Field data to be passed into constructors.
   * If not provided, this will be calculated from the column data.
   * @param {Array} [colFieldClasses] Field class constructors for each column.
   * If not provided, this will be calculated from the column data.
   */
  addRow(isAdditional, colFieldData, colFieldClasses) {
    if (!colFieldData) {
      colFieldData = this.columns.map(this._getFieldData, this)
    }
    if (!colFieldClasses) {
      colFieldClasses = this.columns.map(this._getChildClass)
    }
    if (isAdditional) {
      this.additionalRowCount++
    }
    const row = []
    colFieldData.forEach((fieldData, index) => {
      const FieldClass = colFieldClasses[index]
      row.push(this._getComponentInstance(fieldData, FieldClass))
    })
    this.components.push(row)
  }

  /**
   * Deletes a row of components at the given index.
   * @param {number} index
   */
  deleteRow(index) {
    this.additionalRowCount--
    this.components.splice(index, 1)
  }

  /**
   * Adds a default column (i.e. textfields). Updates both this.columns
   * and this.components, such that the database can be updated correctly
   * and the field is rendered correctly.
   */
  addColumn() {
    const columnData = this._getDefaultColumnData()
    // Update this.columns so database is updated
    this.columns.push(columnData)
    // Update this.components so preview is rendered correctly
    this._spliceColumnAtIndex(columnData, this.columns.length - 1)
  }

  /**
   * Deletes a column at the given index. Updates this.columns so that database
   * can be updated correctly and this.components so that field is rendered
   * correctly.
   * @param {number} index
   */
  deleteColumn(index) {
    // Update this.columns so database is updated
    this.columns.splice(index, 1)
    // Update this.components for preview
    this.components.forEach((row) => {
      row.splice(index, 1)
    })
  }

  changeColumnType(index) {
    // columnType has already been updated via ng-model
    const columnData = this.columns[index]
    // Delete column id so that discriminator key can be updated
    delete columnData._id
    this._spliceColumnAtIndex(columnData, index)
  }

  updateColumnOptions(index) {
    this._spliceColumnAtIndex(this.columns[index], index)
  }

  getResponse() {
    const response = super.getResponse()
    const columnTitles = this.columns.map((col) => col.title)
    // Question in response should contain column titles
    response.question = `${this.title} (${columnTitles.join(', ')})`
    // The backend will look for answerArray instead of answer for tables
    response.answerArray = this.components.map((row) =>
      row.map((component) => component.getResponse().answer),
    )
    return response
  }

  getDefaultBasicData() {
    const fieldData = super.getDefaultBasicData()
    fieldData.minimumRows = 2
    fieldData.addMoreRows = false
    fieldData.additionalRowCount = 0
    fieldData.columns = [
      {
        title: 'Text Field',
        required: true,
        columnType: 'textfield',
      },
    ]
    return fieldData
  }

  getComponentIds() {
    return this.components.map((row) => {
      return row.map((component) => component._id)
    })
  }

  clear(shouldClearMyInfo) {
    this.components.forEach((row) => {
      row.forEach((component) => component.clear(shouldClearMyInfo))
    })
  }

  lock() {
    this.components.forEach((row) => {
      row.forEach((component) => component.lock())
    })
  }

  _spliceColumnAtIndex(columnData, index) {
    const fieldData = this._getFieldData(columnData)
    const FieldClass = this._getChildClass(columnData)
    this.components.forEach((row) => {
      row.splice(index, 1, this._getComponentInstance(fieldData, FieldClass))
    })
  }

  _getComponentInstance(fieldData, FieldClass) {
    // Need to guarantee that the field has a unique ID so that
    // we can check whether it is valid in this.hasError.
    this._makeIdUnique(fieldData)
    return new FieldClass(fieldData)
  }

  _getDefaultColumnData() {
    return {
      title: 'Text Field',
      required: true,
      columnType: 'textfield',
    }
  }

  _makeIdUnique(fieldData) {
    if (!fieldData._id) {
      fieldData._id = 'defaultId'
    }
    fieldData._id += `-${this._counter}`
    this._counter++
  }

  _getFieldData(columnData) {
    const fieldData = { ...columnData, fieldType: columnData.columnType }
    // We don't want to render a title for each component
    delete fieldData.title
    return fieldData
  }

  /**
   * This is a near-copy of getClass in field-factory.js, which currently only
   * handles DateField and TextField. Unfortunately we cannot import field-factory
   * because it would create a circular dependency.
   * @param {Object} columnData Column specification as specified by ColumnSchema
   */
  _getChildClass(columnData) {
    switch (columnData.columnType) {
      case 'dropdown':
        return DropdownField
      case 'textfield':
        return TextField
      default:
        throw new Error('Invalid fieldtype passed to _getChildClass.')
    }
  }
}

module.exports = TableField
