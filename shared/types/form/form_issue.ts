import { FormDto } from './form'
import { Merge } from 'type-fest'
import { DateString } from '../generic'

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

// Convert to serialized version.
export type FormIssueDto = Merge<
  FormIssueBase,
  { created?: DateString; lastModified?: DateString }
>

export type ProcessedIssueMeta = {
  index: number
  issue: string
  email?: string
  timestamp: number
}

export type FormIssueMetaDto = {
  count: number
  issues: ProcessedIssueMeta[]
}
