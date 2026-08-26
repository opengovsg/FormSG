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

export const Default = Template.bind({})
Default.args = {
  ctaUrl: CTA_URL,
  unsubscribeUrl: 'https://example.com/unsubscribe',
  items: [
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
  ],
}

/** A quiet cycle. Fewer than three items is a normal outcome, not a failure. */
export const SingleItem = Template.bind({})
SingleItem.args = {
  ctaUrl: CTA_URL,
  items: [
    {
      title: 'Save your progress and finish later',
      body: 'You can now save a draft of a form you are building and come back to it. Drafts are saved automatically as you work.',
    },
  ],
}

/** Preview sends have no list to unsubscribe from, so the link is omitted. */
export const WithoutUnsubscribe = Template.bind({})
WithoutUnsubscribe.args = {
  ctaUrl: CTA_URL,
  items: Default.args.items,
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
  ],
}
