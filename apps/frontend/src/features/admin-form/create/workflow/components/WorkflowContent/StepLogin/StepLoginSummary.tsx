import { useTranslation } from 'react-i18next'
import { Flex, Stack, Text } from '@chakra-ui/react'

import { FormAuthType } from 'formsg-shared/types'
import { ResolvedStepAuth } from 'formsg-shared/utils/workflow-auth'

import { LogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/LogicBadge'

import { useWorkflowSurfaces } from '../../../hooks/useWorkflowSurfaces'

import { useStepLoginTypeLabel } from './useStepLoginTypeLabel'

/** The login and each check it runs, as grey badges. */
export const StepLoginBadges = ({
  resolved,
  hideAuthType = false,
}: {
  resolved: ResolvedStepAuth
  /** Only the checks, for tables that show the login in its own column. */
  hideAuthType?: boolean
}): JSX.Element => {
  const { t } = useTranslation()
  const getTypeLabel = useStepLoginTypeLabel()
  const isCorppass = resolved.authType === FormAuthType.CP
  const badgeKey = 'features.adminForm.sidebar.workflow.stepLogin.badges'
  return (
    <Flex gap="0.5rem" wrap="wrap">
      {hideAuthType ? null : (
        <LogicBadge>{getTypeLabel(resolved.authType)}</LogicBadge>
      )}
      {resolved.isSubmitterIdCollectionEnabled ? (
        <LogicBadge>
          {t(`${badgeKey}.${isCorppass ? 'collectsUen' : 'collectsNric'}`)}
        </LogicBadge>
      ) : null}
      {resolved.isWhitelistEnabled ? (
        <LogicBadge>
          {t(
            `${badgeKey}.${isCorppass ? 'onlyListedUens' : 'onlyListedNrics'}`,
          )}
        </LogicBadge>
      ) : null}
      {resolved.isSingleSubmission ? (
        <LogicBadge>{t(`${badgeKey}.oneResponseEach`)}</LogicBadge>
      ) : null}
    </Flex>
  )
}

/** "How do they log in?" row on a step card. */
export const StepLoginSummary = ({
  resolved,
}: {
  resolved: ResolvedStepAuth
}): JSX.Element => {
  const { t } = useTranslation()
  const { sectionLabelTextStyle } = useWorkflowSurfaces()
  const getTypeLabel = useStepLoginTypeLabel()
  return (
    <Stack>
      <Text textStyle={sectionLabelTextStyle}>
        {t('features.adminForm.sidebar.workflow.stepLogin.title')}
      </Text>
      {resolved.authType === FormAuthType.NIL ? (
        <Text>{getTypeLabel(FormAuthType.NIL)}</Text>
      ) : (
        <StepLoginBadges resolved={resolved} />
      )}
    </Stack>
  )
}
