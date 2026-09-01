import { useTranslation } from 'react-i18next'
import { BiTrash } from 'react-icons/bi'
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Divider,
  Flex,
  Skeleton,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react'

import { MultirespondentFormSettings } from 'formsg-shared/types'

import { FCC } from '~typings/react'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import Button from '~components/Button'

import { StatusTrackerToggle } from '~features/admin-form/settings/components/EmailNotificationsSection/StatusTrackerToggle'
import { useAdminFormSettings } from '~features/admin-form/settings/queries'

import { useAdminFormWorkflow } from '../../hooks/useAdminFormWorkflow'
import { useIsWorkflowDeletion } from '../../hooks/useIsWorkflowDeletion'
import { DeleteWorkflowModal } from '../DeleteWorkflowModal'

import { NewStepBlock } from './NewStepBlock'
import { WorkflowBlockFactory } from './WorkflowBlockFactory'
import { WorkflowCompletionMessageBlock } from './WorkflowCompletionMessageBlock'

export const WorkflowContent = (): JSX.Element | null => {
  const { t } = useTranslation()
  const { formWorkflow, isLoading } = useAdminFormWorkflow()
  const isWorkflowDeletion = useIsWorkflowDeletion()
  // Read here as well as in StatusTrackerToggle: the closed card has to say
  // whether tracking is on without mounting the row that owns the toggle.
  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings<MultirespondentFormSettings>()
  const hasStatusTracker = Boolean(settings?.hasStatusTracker)
  const {
    isOpen: isDeleteModalOpen,
    onClose: onDeleteModalClose,
    onOpen: onDeleteModalOpen,
  } = useDisclosure()

  if (isLoading) return null
  return (
    <Stack color="secondary.500" spacing="2.75rem" mt="1.5rem">
      <DeleteWorkflowModal
        isOpen={isDeleteModalOpen}
        onClose={onDeleteModalClose}
        entryPoint="workflow-card"
      />
      {/* <HeaderBlock /> */}
      {/* Behind the flag the card is a settings drawer for the workflow as a
          whole, closed by default. Delete is not an icon in the corner but a
          settings row like any other, sharing the shape of the status-tracker
          row above it: label, description, action on the right. Scope is
          stated in words before the modal opens, and a mis-click is near
          impossible because the action sits behind a deliberate open.

          The cost is real and accepted: the status-tracker toggle is visible
          today with no clicks, and it moves behind one. That is a regression
          for an existing setting, traded for a better home for a new one. The
          closed state carries a summary line so the setting is still legible
          without opening, which also earns the height a bare title would not.

          The accordion is gated with the delete row rather than around it. The
          drawer only exists to give delete a home, so with the flag off there
          is nothing to disclose and the card stays exactly as it ships today. */}
      <WorkflowCardShell>
        {isWorkflowDeletion ? (
          <Accordion allowToggle>
            <AccordionItem border="none">
              {/* Same hover tint as the step cards, so a card that opens on
                  click looks like the other cards that respond to one. */}
              <AccordionButton
                p="1.5rem"
                // Right inset matches where the step cards place their pencil,
                // so the two icons sit on the same line down the page.
                pr={{ base: '0.5rem', md: '2rem' }}
                borderRadius="4px"
                transitionProperty="common"
                transitionDuration="normal"
                _hover={{ bg: 'primary.100' }}
              >
                <Stack spacing="0.25rem" flex="1" textAlign="left">
                  <Text as="h2" textStyle="h2" color="secondary.700">
                    {t('features.adminForm.sidebar.workflow.card.title')}
                  </Text>
                  <Skeleton isLoaded={!isLoadingSettings}>
                    <Text textStyle="body-2" color="secondary.400">
                      {t(
                        hasStatusTracker
                          ? 'features.adminForm.sidebar.workflow.card.statusTracking.on'
                          : 'features.adminForm.sidebar.workflow.card.statusTracking.off',
                      )}
                    </Text>
                  </Skeleton>
                </Stack>
                <AccordionIcon color="secondary.500" fontSize="1.5rem" />
              </AccordionButton>
              {/* The panel carries no padding of its own so the divider under
                  the header can run the full width of the card, the way a
                  rule separating header from body should. The rows below it
                  are inset by the stack instead. */}
              <AccordionPanel p="0">
                <Divider />
                <Stack spacing="1.5rem" px="1.5rem" py="1.5rem">
                  <StatusTrackerToggle />
                  <Divider />
                  <Flex
                    justify="space-between"
                    align="flex-start"
                    gap="1rem"
                    direction={{ base: 'column', md: 'row' }}
                  >
                    <Box>
                      <Text textStyle="subhead-1" color="secondary.700">
                        {t(
                          'features.adminForm.sidebar.workflow.card.delete.title',
                        )}
                      </Text>
                      <Text textStyle="body-2" color="secondary.400">
                        {t(
                          'features.adminForm.sidebar.workflow.card.delete.description',
                        )}
                      </Text>
                    </Box>
                    <Button
                      variant="outline"
                      colorScheme="danger"
                      flexShrink={0}
                      leftIcon={<BiTrash fontSize="1.25rem" />}
                      onClick={onDeleteModalOpen}
                    >
                      {t(
                        'features.adminForm.sidebar.workflow.card.delete.action',
                      )}
                    </Button>
                  </Flex>
                </Stack>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        ) : (
          <Stack gap="1.5rem" p="1.5rem">
            <Text as="h2" textStyle="h2">
              {t('features.adminForm.sidebar.workflow.card.title')}
            </Text>
            <Divider />
            <StatusTrackerToggle />
          </Stack>
        )}
      </WorkflowCardShell>
      <Stack spacing="0" divider={<WorkflowStepBlockDivider />}>
        {formWorkflow?.map((step, i) => (
          <WorkflowBlockFactory key={i} stepNumber={i} step={step} />
        ))}
        <NewStepBlock />
      </Stack>
      {formWorkflow?.length ? <WorkflowCompletionMessageBlock /> : null}
    </Stack>
  )
}

/**
 * The card's frame, shared by both states so they cannot drift apart. Padding
 * belongs to the contents, not here: the accordion puts it on the button so
 * the whole header is the click target, while the flag-off card puts it on the
 * stack.
 */
const WorkflowCardShell: FCC = ({ children }) => (
  <Box
    bg="white"
    border="1px solid"
    borderColor="neutral.300"
    borderRadius="4px"
  >
    {children}
  </Box>
)

const WorkflowStepBlockDivider = () => (
  <Box alignSelf="center" justifyContent="center" border="none">
    <Divider
      orientation="vertical"
      h="1rem"
      borderLeftWidth="2px"
      marginLeft="7px"
      borderColor="secondary.200"
    />
    <BxsChevronDown />
    <Divider
      orientation="vertical"
      h="1rem"
      borderLeftWidth="2px"
      marginLeft="7px"
      borderColor="secondary.200"
    />
  </Box>
)
