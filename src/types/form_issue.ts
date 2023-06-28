import { Document, Model } from 'mongoose'
import { FormIssueBase } from 'shared/types'
import type { Merge } from 'type-fest'

import { IFormSchema } from './form'

export type IFormIssue = Merge<FormIssueBase, { formId: IFormSchema['id'] }>

export interface IFormIssueSchema extends IFormIssue, Document {}

export type IFormIssueModel = Model<IFormIssueSchema>
