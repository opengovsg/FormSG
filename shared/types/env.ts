export enum UiCookieValues {
  React = 'react',
  Angular = 'angular',
}

// TODO #4279: Remove after React rollout is complete
export interface PublicFeedbackFormDto {
  [key: string]: string
  url: string
  feedback: string
  email: string
  rumSessionId: string
}

export interface AdminFeedbackFormDto {
  [key: string]: string
  url: string
  feedback: string
  email: string
  rumSessionId: string
  rating: string
}
