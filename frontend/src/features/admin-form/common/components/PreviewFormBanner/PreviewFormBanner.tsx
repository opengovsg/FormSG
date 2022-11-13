import { BiShow } from 'react-icons/bi'
import { Link as ReactLink } from 'react-router-dom'
import { Flex, Icon, Stack, Text, useDisclosure } from '@chakra-ui/react'

import { ADMINFORM_ROUTE, DASHBOARD_ROUTE } from '~constants/routes'
import Button from '~components/Button'
import Link from '~components/Link'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'
import { DuplicateFormModal } from '~features/workspace/components/DuplicateFormModal'

interface PreviewFormBannerProps {
  isTemplate?: boolean
}

export const PreviewFormBanner = ({
  isTemplate,
}: PreviewFormBannerProps): JSX.Element => {
  const { formId } = usePublicFormContext()
  const { isOpen, onOpen, onClose } = useDisclosure()
  return (
    <Flex
      bg="primary.100"
      py="1rem"
      px="2rem"
      display="flex"
      width="100%"
      // position="fixed"
    >
      <Flex align="center" flex={1} justify="space-between" flexDir="row">
        <Flex align="center">
          <Icon aria-hidden as={BiShow} fontSize="1rem" mr="0.75rem" />
          <Text textStyle="subhead-3">Form Preview</Text>
        </Flex>
        {isTemplate ? (
          <Stack spacing="1rem" direction="row">
            <Link
              variant="standalone"
              aria-label="Click to return to the admin dashboard"
              as={ReactLink}
              to={DASHBOARD_ROUTE}
            >
              Back to FormSG
            </Link>
            <Button aria-label="Click to use this template" onClick={onOpen}>
              Use this template
            </Button>
          </Stack>
        ) : (
          <Button
            aria-label="Click to edit the form"
            as={ReactLink}
            to={`${ADMINFORM_ROUTE}/${formId}`}
          >
            Edit form
          </Button>
        )}
      </Flex>
      <DuplicateFormModal
        formId={formId}
        isTemplate
        isOpen={isOpen}
        onClose={onClose}
      />
    </Flex>
  )
}
