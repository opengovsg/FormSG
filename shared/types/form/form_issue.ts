import { FormDto } from './form'

export type SubmitFormIssueBodyDto = {
  isPreview?: boolean
  issue: string
  email?: string
}

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
