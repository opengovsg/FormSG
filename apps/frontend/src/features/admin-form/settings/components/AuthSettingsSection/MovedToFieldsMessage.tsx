import { ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link as ReactLink, useParams } from 'react-router-dom'
import { Stack, Text } from '@chakra-ui/react'

import { FormAuthType } from 'formsg-shared/types/form'

import { ADMINFORM_ROUTE } from '~constants/routes'
import InlineMessage from '~components/InlineMessage'
import Link from '~components/Link'

import {
  FieldListTabIndex,
  openFieldListTabState,
} from '~features/admin-form/create/builder-and-design/constants'

// Trans fills in the link text from the translation.
const BuilderLink = ({
  formId,
  tab,
  children,
}: {
  formId?: string
  tab: FieldListTabIndex
  children?: ReactNode
}) => (
  <Link
    as={ReactLink}
    to={`${ADMINFORM_ROUTE}/${formId}`}
    state={openFieldListTabState(tab)}
  >
    {children}
  </Link>
)

/**
 * Tells admins looking for the "Collect NRIC/FIN/UENs" toggle that it is now
 * a field, and links to the field tab that offers it.
 */
export const MovedToFieldsMessage = ({
  authType,
}: {
  authType: FormAuthType
}): JSX.Element => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.settings.singpass.submitterIdCollection',
  })
  const { formId } = useParams()
  const isCorppass = authType === FormAuthType.CP
  const login = isCorppass ? 'corppass' : 'singpass'
  const tab = isCorppass ? FieldListTabIndex.Corppass : FieldListTabIndex.MyInfo

  return (
    <InlineMessage>
      <Stack spacing={0}>
        <Text>
          <Trans
            t={t}
            i18nKey={`${login}.movedToFields`}
            components={{
              builderLink: <BuilderLink formId={formId} tab={tab} />,
            }}
          />
        </Text>
        <Text>{t('otherFormsAutoConvertNotice')}</Text>
      </Stack>
    </InlineMessage>
  )
}
