import { isEmpty } from 'lodash'
import { Schema } from 'mongoose'

import { BasicField } from '../../../../shared/types'
import { IColumnSchema, ITableFieldSchema } from '../../../types'

const createColumnSchema = () => {
  const ColumnSchema = new Schema<IColumnSchema>(
    {
      title: {
        type: String,
        trim: true,
        required: true,
      },
      required: {
        type: Boolean,
        required: true,
      },
    },
    {
      discriminatorKey: 'columnType',
      _id: false,
    },
  )

  ColumnSchema.pre<IColumnSchema>('validate', function (next) {
    const columnTypes = [BasicField.ShortText, BasicField.Dropdown]
    const index = columnTypes.indexOf(this.columnType)
    if (index > -1) {
      return next()
    } else {
      return next(Error('Column type is incorrect or unspecified'))
    }
  })
  return ColumnSchema
}

const createTableFieldSchema = () => {
  const ColumnSchema = createColumnSchema()

  const TableFieldSchema = new Schema<ITableFieldSchema>({
    minimumRows: {
      type: Number,
      min: 1,
      required: true,
    },
    maximumRows: {
      type: Number,
      min: 2,
      validate: {
        validator: function (this: ITableFieldSchema, v?: number) {
          return !v || v > this.minimumRows
        },
        message: 'Maximum number of rows must be greater than minimum.',
      },
    },
    addMoreRows: {
      type: Boolean,
      default: false,
    },
    columns: [ColumnSchema],
  })

  TableFieldSchema.pre<ITableFieldSchema>('validate', function (next) {
    if (isEmpty(this.columns)) {
      return next(Error('There must be at least 1 column in a Table field.'))
    }
    if (!this.addMoreRows && !!this.maximumRows) {
      this.maximumRows = undefined
    }
    return next()
  })

  return TableFieldSchema
}

export default createTableFieldSchema
