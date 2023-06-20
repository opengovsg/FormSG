import { FormDto } from './form'

export type FormIssueBodyDto = {
  isPreview?: boolean
  issue: string
  email?: string
  formId: FormDto['_id']
}
