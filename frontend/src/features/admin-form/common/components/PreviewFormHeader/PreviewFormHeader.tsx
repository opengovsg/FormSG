import { Link as ReactLink } from 'react-router-dom'
import { Flex, Icon, Text } from '@chakra-ui/react'

import { FormAuthType } from '~shared/types'

import { BxsEditAlt } from '~assets/icons/BxsEditAlt'
import { ADMINFORM_ROUTE } from '~constants/routes'
import Link from '~components/Link'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

export type PreviewHeaderMode = 'preview'

export const PreviewFormHeader = (): JSX.Element => {
  const { form, formId } = usePublicFormContext()

  return (
    <Flex bg="success.600" px="2rem" display="flex" width="100%">
      <Flex align="center" flex={1} justify="space-between" flexDir="row">
        <Text textStyle="caption-1">
          Preview{' '}
          {form?.authType !== FormAuthType.NIL ? 'with test data' : 'mode'}
        </Text>
        <Link
          variant="standalone"
          color="secondary.700"
          aria-label="Click to edit the form"
          as={ReactLink}
          to={`${ADMINFORM_ROUTE}/${formId}`}
        >
          <Flex align="center">
            <Icon aria-hidden as={BxsEditAlt} fontSize="1rem" mr="0.75rem" />
            <Text textStyle="subhead-2">Edit form</Text>
          </Flex>
        </Link>
      </Flex>
    </Flex>
  )
}
