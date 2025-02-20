import { killEmailMode } from './config'

// TODO: (Kill Email Mode) Remove this class after kill email mode is fully implemented.
class FeedbackFormConfig {
  private static instance: FeedbackFormConfig
  private testingFormId: string | null = null

  private constructor() {}

  static getInstance(): FeedbackFormConfig {
    if (!FeedbackFormConfig.instance) {
      FeedbackFormConfig.instance = new FeedbackFormConfig()
    }
    return FeedbackFormConfig.instance
  }

  setTestingFormId(formId: string) {
    this.testingFormId = formId
  }

  getFormId(): string {
    if (process.env.NODE_ENV === 'test' && this.testingFormId) {
      return this.testingFormId
    }
    return killEmailMode.feedbackFormId
  }
}

export const feedbackFormConfig = FeedbackFormConfig.getInstance()
