import { Document, Model, QueryCursor } from 'mongoose'
import { FormIssueBase } from 'shared/types'
import type { Merge } from 'type-fest'

import { IFormSchema } from './form'

export type IFormIssue = Merge<FormIssueBase, { formId: IFormSchema['id'] }>

export interface IFormIssueSchema extends IFormIssue, Document {}

export type FormIssueStreamData = Pick<
  IFormIssueSchema,
  'issue' | 'email' | 'created'
>

export interface IFormIssueModel extends Model<IFormIssueSchema> {
  /**
   * Returns a cursor for all issues for the form with formId.
   * @param formId the form id to return the cursor for
   * @param fields an array of field names to retrieve
   * @returns a cursor to the issue retrieved
   */
  getIssueCursorByFormId(
    formId: string,
    fields: (keyof IFormIssueSchema)[],
  ): QueryCursor<FormIssueStreamData>
}
