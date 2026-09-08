import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Flex,
  Stack,
  Text,
  usePrefersReducedMotion,
} from '@chakra-ui/react'

import Button from '~components/Button'

import {
  startBuildingFromWelcomeSelector,
  useAdminWorkflowStore,
} from '../../adminWorkflowStore'
import { FormToWorkflowIllustration } from '../FormToWorkflowIllustration'

const WELCOME_I18N_PREFIX = 'features.adminForm.sidebar.workflow.welcome'

const ILLUSTRATION_DELAY_MS = 600

const LEAVE_DURATION_MS = 150

export const WelcomeCard = (): JSX.Element => {
  const { t } = useTranslation()
  const startBuilding = useAdminWorkflowStore(startBuildingFromWelcomeSelector)
  const prefersReducedMotion = usePrefersReducedMotion()

  const [showWorkflow, setShowWorkflow] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    if (prefersReducedMotion) {
      setShowWorkflow(true)
      return
    }
    const timer = setTimeout(() => setShowWorkflow(true), ILLUSTRATION_DELAY_MS)
    return () => clearTimeout(timer)
  }, [prefersReducedMotion])

  const handleStartBuilding = () => {
    if (prefersReducedMotion) {
      startBuilding()
      return
    }
    setIsLeaving(true)
    setTimeout(startBuilding, LEAVE_DURATION_MS)
  }

  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="neutral.300"
      borderRadius="8px"
      p={{ base: '1.5rem', md: '2.5rem' }}
      opacity={isLeaving ? 0 : 1}
      transform={isLeaving ? 'translateY(-8px)' : 'translateY(0)'}
      transition={
        prefersReducedMotion
          ? undefined
          : `opacity ${LEAVE_DURATION_MS}ms ease-in, transform ${LEAVE_DURATION_MS}ms ease-in`
      }
    >
      <Flex
        direction={{ base: 'column', md: 'row' }}
        gap={{ base: '2rem', md: '2.5rem' }}
        align="center"
      >
        <Box flexShrink={0} w={{ base: '100%', md: '17.5rem' }}>
          <FormToWorkflowIllustration
            showWorkflow={showWorkflow}
            showSpotlight
          />
        </Box>

        <Stack spacing="1.5rem" flex={1}>
          <Stack spacing="0.75rem">
            <Text textStyle="h4" color="secondary.500">
              {t(`${WELCOME_I18N_PREFIX}.header`)}
            </Text>
            <Text textStyle="body-1" color="secondary.400">
              {t(`${WELCOME_I18N_PREFIX}.stepOne`)}
            </Text>
            <Text textStyle="body-1" color="secondary.400">
              {t(`${WELCOME_I18N_PREFIX}.whatNext`)}
            </Text>
          </Stack>
          <Box>
            <Button onClick={handleStartBuilding}>
              {t(`${WELCOME_I18N_PREFIX}.cta`)}
            </Button>
          </Box>
        </Stack>
      </Flex>
    </Box>
  )
}
