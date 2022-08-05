export enum UiCookieValues {
  React = 'react',
  Angular = 'angular',
}

// TODO #4279: Remove after React rollout is complete
export interface switchEnvFeedbackFormBodyDto {
  [key: string]: string
  url: string
  feedback: string
  email: string
}
