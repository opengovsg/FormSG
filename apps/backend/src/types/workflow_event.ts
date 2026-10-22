import {
  AdminWorkflowEventBase,
  StepSubmittedEventBase,
} from 'formsg-shared/types'

import { IUserSchema } from './user'

export type IAdminWorkflowEvent = AdminWorkflowEventBase & {
  actorId: IUserSchema['_id']
  created: Date
}

export type IStepSubmittedEvent = StepSubmittedEventBase & {
  created: Date
}

export type IWorkflowEvent = IAdminWorkflowEvent | IStepSubmittedEvent
