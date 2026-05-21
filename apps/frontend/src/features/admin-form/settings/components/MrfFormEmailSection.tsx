import { useMemo } from 'react'
import {
  BiCaretDownSquare,
  BiEnvelope,
  BiMailSend,
  BiUser,
} from 'react-icons/bi'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Flex, Icon, Link, Stack, Text } from '@chakra-ui/react'

import type { MultirespondentFormSettings } from 'formsg-shared/types/form'

import InlineMessage from '~components/InlineMessage'

import type { RespondentType } from '~features/admin-form/create/workflow-v2/types'
import {
  fieldsSelector,
  notificationRecipientIdsSelector,
  respondentsSelector,
  useWorkflowBuilderStore,
} from '~features/admin-form/create/workflow-v2/workflowBuilderStore'

const RESPONDENT_TYPE_ICON: Record<RespondentType, typeof BiUser> = {
  form_link: BiUser,
  collaborator: BiUser,
  email_field: BiEnvelope,
  specific_email: BiMailSend,
  dropdown_field: BiCaretDownSquare,
}

interface MrfFormEmailSectionProps {
  settings: MultirespondentFormSettings
  isDisabled: boolean
  isHighContrast?: boolean
}

export const MrfFormEmailSection = ({
  settings: _settings,
  isDisabled: _isDisabled,
  isHighContrast: _isHighContrast = true,
}: MrfFormEmailSectionProps): JSX.Element => {
  const { formId } = useParams()
  const navigate = useNavigate()
  const respondents = useWorkflowBuilderStore(respondentsSelector)
  const fields = useWorkflowBuilderStore(fieldsSelector)
  const notificationRecipientIds = useWorkflowBuilderStore(
    notificationRecipientIdsSelector,
  )

  const notificationRespondents = useMemo(
    () => respondents.filter((r) => notificationRecipientIds.includes(r.id)),
    [respondents, notificationRecipientIds],
  )

  const handleGoToWorkflow = () => {
    if (formId) {
      navigate(`/admin/form/${formId}`)
    }
  }

  const getDescription = (r: (typeof notificationRespondents)[0]) => {
    const linkedField = r.linkedFieldId
      ? fields.find((f) => f.id === r.linkedFieldId)
      : undefined
    if (r.type === 'email_field' && linkedField) {
      return `Emails filled into the ${linkedField.number}. ${linkedField.name} field`
    }
    if (r.type === 'dropdown_field' && linkedField) {
      return `Emails assigned to options in the ${linkedField.number}. ${linkedField.name} field`
    }
    return r.description
  }

  return (
    <Box>
      <InlineMessage mb="1.5rem">
        <span>
          Notification recipients are managed in the{' '}
          <Link
            color="primary.500"
            textDecoration="underline"
            cursor="pointer"
            onClick={handleGoToWorkflow}
          >
            Workflow tab
          </Link>
          .
        </span>
      </InlineMessage>

      <Text textStyle="subhead-2" color="secondary.500" mb="0.75rem">
        Who gets notified
      </Text>

      {notificationRespondents.length > 0 ? (
        <Stack spacing="0.75rem">
          {notificationRespondents.map((r) => {
            const TypeIcon = RESPONDENT_TYPE_ICON[r.type]
            const description = getDescription(r)
            return (
              <Flex
                key={r.id}
                align="center"
                gap="0.75rem"
                borderRadius="8px"
                border="1px solid"
                borderColor="neutral.300"
                bg="white"
                p="1rem"
              >
                <Icon
                  as={TypeIcon}
                  fontSize="1.5rem"
                  color="secondary.500"
                  flexShrink={0}
                />
                <Box flex={1} minW={0}>
                  <Text
                    textStyle="subhead-1"
                    color="secondary.500"
                    noOfLines={1}
                  >
                    {r.name}
                  </Text>
                  {description && (
                    <Text
                      textStyle="body-2"
                      color="secondary.400"
                      noOfLines={2}
                    >
                      {description}
                    </Text>
                  )}
                </Box>
              </Flex>
            )
          })}
        </Stack>
      ) : (
        <Text textStyle="body-2" color="secondary.400">
          No notification recipients configured.
        </Text>
      )}
    </Box>
  )
}
