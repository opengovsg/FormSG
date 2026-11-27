import { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as ReactLink, useParams } from 'react-router'
import { Stack, Text } from '@chakra-ui/react'

import { FormAuthType } from 'formsg-shared/types/form'

import { ADMINFORM_ROUTE } from '~constants/routes'
import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'

import {
  FieldListTabIndex,
  openFieldListTabState,
} from '~features/admin-form/create/builder-and-design/constants'
import { useUsesStepLoginRules } from '~features/admin-form/create/workflow/hooks/useUsesStepLoginRules'

/**
 * Tells admins looking for the "Collect NRIC/FIN/UENs" toggle that it is now
 * a field, and links to the field tab that offers it.
 */
export const MovedToFieldsMessage = ({
  authType,
  actionRef,
}: {
  authType: FormAuthType
  actionRef?: RefObject<HTMLAnchorElement>
}): JSX.Element => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.settings.singpass.submitterIdCollection',
  })
  const { formId } = useParams()
  const usesStepLoginRules = useUsesStepLoginRules()
  const isCorppass = authType === FormAuthType.CP
  const login = isCorppass ? 'corppass' : 'singpass'
  const tab = isCorppass ? FieldListTabIndex.Corppass : FieldListTabIndex.MyInfo
  const goToFieldsLabel = usesStepLoginRules
    ? t('addNricField')
    : t(`${login}.goToFields`)

  return (
    <InlineMessage>
      <Stack spacing="0.75rem" align="flex-start">
        <Text>{t(`${login}.movedToFields`)}</Text>
        <Text>{t('otherFormsAutoConvertNotice')}</Text>
        <Button
          as={ReactLink}
          ref={actionRef}
          variant="outline"
          to={`${ADMINFORM_ROUTE}/${formId}`}
          state={openFieldListTabState(tab)}
        >
          {goToFieldsLabel}
        </Button>
      </Stack>
    </InlineMessage>
  )
}
