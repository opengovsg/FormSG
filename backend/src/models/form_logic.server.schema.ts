import { Schema } from 'mongoose'

import {
  IConditionSchema,
  ILogicSchema,
  IPreventSubmitLogicSchema,
  IShowFieldsLogicSchema,
  LogicConditionState,
  LogicIfValue,
  LogicType,
} from '@root/types'

const LogicConditionSchema = new Schema<IConditionSchema>({
  _id: String,
  field: {
    // No need for `ref` sub-key as the id is only used to check if a field has
    // a logic condition attached to it in the frontend.
    type: Schema.Types.ObjectId,
    required: true,
  },
  state: {
    type: String,
    required: true,
    enum: Object.values(LogicConditionState),
  },
  value: {
    type: Schema.Types.Mixed,
    required: true,
  },
  ifValueType: {
    type: String,
    enum: Object.values(LogicIfValue),
    default: LogicIfValue.Number,
  },
})

const LogicSchema = new Schema<ILogicSchema>(
  {
    conditions: {
      type: [LogicConditionSchema],
      required: true,
    },
    logicType: {
      type: String,
      enum: Object.values(LogicType),
      default: LogicType.ShowFields,
    },
  },
  {
    discriminatorKey: 'logicType',
  },
)

export const ShowFieldsLogicSchema = new Schema<IShowFieldsLogicSchema>({
  show: {
    type: [
      {
        type: Schema.Types.ObjectId,
      },
    ],
    required: true,
  },
})

export const PreventSubmitLogicSchema = new Schema<IPreventSubmitLogicSchema>({
  preventSubmitMessage: String,
})

export default LogicSchema
