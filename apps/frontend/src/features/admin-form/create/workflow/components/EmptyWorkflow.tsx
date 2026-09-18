import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BiPlus } from 'react-icons/bi'

import { Box, Flex, Stack, Text } from '@chakra-ui/react'

import Button from '~components/Button'
import Link from '~components/Link'
import Tooltip from '~components/Tooltip'
import { GUIDE_FORM_MRF } from '~constants/links'

import {
  setToCreatingSelector,
  showWelcomeCardSelector,
  useAdminWorkflowStore,
} from '../adminWorkflowStore'
import { useAdminFormWorkflow } from '../hooks/useAdminFormWorkflow'
import { useGuidedSetupPreference } from '../hooks/useGuidedSetupPreference'
import { useGuidedSetupTaught } from '../hooks/useGuidedSetupTaught'
import { useIsWorkflowBuilderRedesign } from '../hooks/useIsWorkflowBuilderRedesign'
import {
  FormToWorkflowIllustration,
  ILLUSTRATION_MAX_W,
} from './FormToWorkflowIllustration'
import { WorkflowSvgr } from './WorkflowSvgr'

const INTRO_I18N_PREFIX = 'features.adminForm.sidebar.workflow.intro'

export const INTRO_ILLUSTRATION_TEST_ID = 'workflow-intro-illustration'

export const EmptyWorkflow = (): JSX.Element => {
  const { t } = useTranslation()
  const setToCreating = useAdminWorkflowStore(setToCreatingSelector)
  const { setGuidedSetup } = useGuidedSetupPreference()
  const showWelcomeCard = useAdminWorkflowStore(showWelcomeCardSelector)
  const isRedesign = useIsWorkflowBuilderRedesign()
  const [isIllustrationHovered, setIsIllustrationHovered] = useState(false)

  const startSetup = (isGuidedSetup: boolean) => () => {
    setGuidedSetup(isGuidedSetup)
    if (isGuidedSetup && !hasBeenTaught) {
      showWelcomeCard()
      return
    }
    setToCreating()
  }
  const { isPaymentEnabled } = useAdminFormWorkflow()
  const { hasBeenTaught } = useGuidedSetupTaught()

  const paymentBlockedLabel = isPaymentEnabled
    ? t('features.adminForm.sidebar.workflow.paymentEnabledNoSteps')
    : undefined

  if (isRedesign) {
    return (
      <Flex
        textAlign="center"
        flexDir="column"
        align="center"
        color="secondary.500"
        pt={{ base: '0.5rem', md: '2.75rem' }}
      >
        <Text textStyle="h2" as="h2">
          {t(`${INTRO_I18N_PREFIX}.header`)}
        </Text>
        <Text textStyle="body-1" mt="1rem">
          {t(`${INTRO_I18N_PREFIX}.subheader`)}
        </Text>
        <Tooltip
          label={paymentBlockedLabel}
          shouldWrapChildren={isPaymentEnabled}
        >
          <Stack
            direction={{ base: 'column', md: 'row' }}
            spacing="0.75rem"
            my="2.5rem"
            justify="center"
          >
            <Button onClick={startSetup(true)} isDisabled={isPaymentEnabled}>
              {t(`${INTRO_I18N_PREFIX}.guided`)}
            </Button>
            <Button
              variant="outline"
              onClick={startSetup(false)}
              isDisabled={isPaymentEnabled}
            >
              {t(`${INTRO_I18N_PREFIX}.manual`)}
            </Button>
          </Stack>
        </Tooltip>
        <Box
          data-testid={INTRO_ILLUSTRATION_TEST_ID}
          w="100%"
          maxW={ILLUSTRATION_MAX_W}
          onMouseEnter={() => setIsIllustrationHovered(true)}
          onMouseLeave={() => setIsIllustrationHovered(false)}
        >
          <FormToWorkflowIllustration showWorkflow={isIllustrationHovered} />
        </Box>
      </Flex>
    )
  }

  return (
    <Flex
      textAlign="center"
      flexDir="column"
      align="center"
      color="secondary.500"
      pt={{ base: '0.5rem', md: '2.75rem' }}
    >
      <Text textStyle="h2" as="h2">
        Create a workflow to collect responses from multiple respondents in the
        same form submission
      </Text>
      <Text textStyle="body-1" mt="1rem">
        Assign respondents to specific steps, and control which fields they can
        fill.{' '}
        <Link isExternal href={GUIDE_FORM_MRF}>
          Learn how to create a workflow
        </Link>
      </Text>
      <Tooltip
        label={paymentBlockedLabel}
        shouldWrapChildren={isPaymentEnabled}
      >
        <Button
          my="2.5rem"
          leftIcon={<BiPlus fontSize="1.5rem" />}
          onClick={setToCreating}
          isDisabled={isPaymentEnabled}
        >
          Create workflow
        </Button>
      </Tooltip>
      <WorkflowSvgr maxW="292px" />
    </Flex>
  )
}
