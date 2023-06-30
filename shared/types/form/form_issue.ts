import { FormDto } from './form'

export type FormIssueBodyDto = {
  isPreview?: boolean
  issue: string
  email?: string
  formId: FormDto['_id']
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
