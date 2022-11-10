import { BiShow } from 'react-icons/bi'
import { Link as ReactLink } from 'react-router-dom'
import { Flex, Icon, Text } from '@chakra-ui/react'

import { ADMINFORM_ROUTE } from '~constants/routes'
import Button from '~components/Button'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

export const PreviewFormBanner = (): JSX.Element => {
  const { formId } = usePublicFormContext()

  return (
    <Flex bg="primary.100" py="1rem" px="2rem" display="flex" width="100%">
      <Flex align="center" flex={1} justify="space-between" flexDir="row">
        <Flex align="center">
          <Icon aria-hidden as={BiShow} fontSize="1rem" mr="0.75rem" />
          <Text textStyle="subhead-3">Form Preview</Text>
        </Flex>
        <Button
          aria-label="Click to edit the form"
          as={ReactLink}
          to={`${ADMINFORM_ROUTE}/${formId}`}
        >
          Edit form
        </Button>
      </Flex>
    </Flex>
  )
}
