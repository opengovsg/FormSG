import { Template } from '.'

export const enSG: Template = {
  previewLabel: 'Template Preview',
  useTemplate: 'Use this template',
  useTemplateAriaLabel: 'Click to use this template',
  backToFormsg: 'Back to FormSG',
  useTemplateTour: {
    tooltip: {
      badge: 'Tip',
      done: 'Got it',
    },
    steps: [
      {
        title: 'This is a template preview',
        content:
          "You can't submit responses here. Click 'Use this template' to make your own copy.",
      },
    ],
  },
  useTemplateWall: {
    title: 'This is a template preview',
    body: "You can't submit responses here. Click 'Use this template' to make your own copy.",
    continuePreview: 'Continue to preview',
    useTemplate: 'Use this template',
  },
}
