import { FormResponseMode, FormAuthType } from './form'

export enum UiCookieValues {
  React = 'react',
  Angular = 'angular',
}

// TODO #4279: Remove after React rollout is complete
export interface PublicFeedbackFormDto {
  [key: string]: any
  url: string
  feedback: string
  email: string
  rumSessionId: string
  userAgent: string
  attachmentType: string[]
  othersInput: string
  responseMode: FormResponseMode
  authType: FormAuthType
}

export interface AdminFeedbackFormDto {
  [key: string]: string
  url: string
  feedback: string
  email: string
  rumSessionId: string
  rating: string
}
