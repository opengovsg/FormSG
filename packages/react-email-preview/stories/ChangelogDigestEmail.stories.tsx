import { Meta, StoryFn } from '@storybook/react'

import ChangelogDigestEmail, {
  type ChangelogDigestHtmlData,
} from '../emails/ChangelogDigestEmail'

export default {
  title: 'EmailPreview/ChangelogDigestEmail',
  component: ChangelogDigestEmail,
  decorators: [],
} as Meta

const Template: StoryFn<ChangelogDigestHtmlData> = (args) => (
  <ChangelogDigestEmail {...args} />
)

const CTA_URL = 'https://form.gov.sg'

/**
 * Fresh objects per story. Sharing one array between stories lets Storybook's
 * controls mutate args in one and have them change in another, which reads as a
 * template bug rather than a harness one.
 */
const threeItems = () => [
  {
    title: 'Save your progress and finish later',
    body: 'You can now save a draft of a form you are building and come back to it. Drafts are saved automatically as you work.',
  },
  {
    title: 'Edit logic and workflow steps in place',
    body: 'Click any logic or workflow card to edit it directly, instead of reopening it from the side panel.',
  },
  {
    title: 'Stronger one-time passwords',
    body: 'One-time passwords are now 8 characters and include letters, making them harder to guess.',
  },
]

/**
 * Every story carries three items, because a digest carries three or it is not
 * sent. A cycle that finds fewer records nothing and holds those changes over,
 * so a one- or two-item digest is not a quiet week — it is a state the pipeline
 * cannot produce, and previewing it would invite someone to design for it.
 */
export const Default = Template.bind({})
Default.args = {
  ctaUrl: CTA_URL,
  unsubscribeUrl: 'https://example.com/unsubscribe',
  items: threeItems(),
}

/** Preview sends have no list to unsubscribe from, so the link is omitted. */
export const WithoutUnsubscribe = Template.bind({})
WithoutUnsubscribe.args = {
  ctaUrl: CTA_URL,
  items: threeItems(),
}

/** Long copy is the realistic failure mode for the card layout. */
export const LongCopy = Template.bind({})
LongCopy.args = {
  ctaUrl: CTA_URL,
  unsubscribeUrl: 'https://example.com/unsubscribe',
  items: [
    {
      title:
        'Save your progress on long forms and pick up exactly where you left off',
      body: 'Forms with many fields no longer need to be completed in one sitting. Your progress is saved automatically as you work, and you can return to an unfinished form from your dashboard at any time within the next 30 days.',
    },
    {
      title: 'Attach supporting documents up to 20MB',
      body: 'The attachment size limit has been raised, so respondents can upload scans and photographs without compressing them first.',
    },
    {
      title:
        'See at a glance which of your forms are approaching their response limit',
      body: 'The dashboard now shows how close each form is to the limit you set, so you can raise it before responses start being turned away rather than afterwards.',
    },
  ],
}
