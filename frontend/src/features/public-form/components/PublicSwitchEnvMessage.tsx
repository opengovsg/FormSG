// TODO #4279: Remove after React rollout is complete
import { KeyboardEventHandler, useCallback, useMemo } from 'react'
import {
  Box,
  Flex,
  Text,
  useDisclosure,
  VisuallyHidden,
} from '@chakra-ui/react'

import { FormAuthType, FormResponseMode } from '~shared/types'

import { noPrintCss } from '~utils/noPrintCss'
import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'

import { PublicFeedbackModal } from '~features/env/PublicFeedbackModal'
import { useEnv } from '~features/env/queries'

type PublicSwitchEnvMessageProps = {
  responseMode?: FormResponseMode
  isAuthRequired: boolean
  authType?: FormAuthType
}

export const PublicSwitchEnvMessage = ({
  responseMode,
  isAuthRequired,
  authType,
}: PublicSwitchEnvMessageProps): JSX.Element | null => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  const {
    data: {
      respondentRolloutEmail,
      respondentRolloutStorage,
      removeRespondentsInfoboxThreshold,
    } = {},
  } = useEnv()

  const switchEnvRolloutPercentage = useMemo(
    () =>
      responseMode === FormResponseMode.Email
        ? respondentRolloutEmail
        : respondentRolloutStorage,
    [responseMode, respondentRolloutEmail, respondentRolloutStorage],
  )

  // Remove the switch env message if the React rollout for public form respondents is => threshold
  const showSwitchEnvMessage = useMemo(
    () =>
      !!(
        switchEnvRolloutPercentage &&
        removeRespondentsInfoboxThreshold &&
        switchEnvRolloutPercentage < removeRespondentsInfoboxThreshold
      ),
    [switchEnvRolloutPercentage, removeRespondentsInfoboxThreshold],
  )

  const handleKeydown: KeyboardEventHandler<HTMLButtonElement> = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        onOpen()
        event.preventDefault()
      }
    },
    [onOpen],
  )

  if (!showSwitchEnvMessage) return null

  return (
    <Flex
      mt={isAuthRequired ? undefined : '-2.5rem'}
      justify="center"
      sx={noPrintCss}
    >
      <Box w="100%" minW={0} h="fit-content" maxW="57rem">
        <InlineMessage
          variant="warning"
          mb="1.5rem"
          mt={{ base: '2rem', md: '0' }}
          id="switch-env-msg"
        >
          <Text>
            You’re using the new FormSG design. If you have trouble submitting,{' '}
            <Button
              tabIndex={0}
              p={0}
              as="u"
              variant="link"
              display="inline"
              my="-0.25rem"
              onClick={onOpen}
              onKeyDown={handleKeydown}
              aria-labelledby="switch-env-msg"
              cursor="pointer"
            >
              <VisuallyHidden>
                Click to switch to the original FormSG
              </VisuallyHidden>
              <Text as="span" display="inline" aria-hidden>
                switch to the original one here
              </Text>
            </Button>
            .
          </Text>
        </InlineMessage>
      </Box>
      <PublicFeedbackModal
        isOpen={isOpen}
        onClose={onClose}
        responseMode={responseMode}
        authType={authType}
      />
    </Flex>
  )
}
