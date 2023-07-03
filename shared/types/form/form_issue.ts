import { FormDto } from './form'

/**
 * Typing for individual form issue
 */
export type FormIssueBase = {
  formId: FormDto['_id']
  issue: string
  email?: string
  created?: Date
  lastModified?: Date
}
