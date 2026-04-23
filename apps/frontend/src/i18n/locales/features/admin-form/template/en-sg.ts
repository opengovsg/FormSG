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
        title: 'Duplicate this form',
        content:
          'You’re viewing a template. Click "Use this template" to make your own copy — you won’t be submitting responses here.',
      },
    ],
  },
  useTemplateWall: {
    title: 'You’re previewing a template',
    body: 'This page is a read-only template, not a live form. To create your own version, use the template — or continue scrolling if you just want to preview it.',
    continuePreview: 'Continue to Preview',
    useTemplate: 'Use this template',
  },
}
