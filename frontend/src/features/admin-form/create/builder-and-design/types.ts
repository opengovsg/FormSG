import { FormField, FormFieldDto } from '~shared/types/field'

import { PENDING_CREATE_FIELD_ID } from './constants'

export type DndPlaceholderProps =
  | {
      droppableId: string
      clientHeight: number
      clientWidth: string
      clientY: number
      clientX: number
    }
  | Record<string, never>

export type PendingFormField = FormField & {
  _id: typeof PENDING_CREATE_FIELD_ID
}

export type BuilderContentField = FormFieldDto | PendingFormField
