import { useTranslation } from 'react-i18next'

import { MRF_CUTOVER_FAQ_LINK } from 'formsg-shared/constants/links'

import { OGP_PLUMBER } from '~constants/links'
import InlineMessage from '~components/InlineMessage'

export const WebhookWorkflowInfobox = (): JSX.Element => {
  const { t } = useTranslation()

  return (
    <InlineMessage variant="info" useMarkdown mb="1rem">
      {t('features.adminForm.settings.webhooks.workflowInfobox', {
        plumberUrl: OGP_PLUMBER,
        learnMoreUrl: MRF_CUTOVER_FAQ_LINK,
      })}
    </InlineMessage>
  )
}
