import { useEffect } from 'react'
import { Box, Flex } from '@chakra-ui/react'

import InlineMessage from '~components/InlineMessage'

import { useAdminFormSettings } from '~features/admin-form/settings/queries'

import { DndPlaceholderProps } from '../types'
import {
  setToInactiveSelector,
  useFieldBuilderStore,
} from '../useFieldBuilderStore'

import { FormBuilder } from './FormBuilder'

interface BuilderAndDesignContentProps {
  placeholderProps: DndPlaceholderProps
}

export const BuilderAndDesignContent = ({
  placeholderProps,
}: BuilderAndDesignContentProps): JSX.Element => {
  const { data: settings } = useAdminFormSettings()

  const setFieldsToInactive = useFieldBuilderStore(setToInactiveSelector)

  useEffect(() => {
    setFieldsToInactive()
    return () => setFieldsToInactive()
  }, [setFieldsToInactive])

  return (
    <Flex flex={1} overflow="auto">
      <Box w="100%">
        {settings?.webhook?.url ? (
          <InlineMessage
            mx={{ base: 0, md: '2rem' }}
            mt={{ base: 0, md: '2rem' }}
            mb={{ base: 0, md: '-1rem' }}
          >
            Webhooks are enabled on this form. Please ensure the webhook server
            is able to handle any field changes.
          </InlineMessage>
        ) : null}
        <FormBuilder placeholderProps={placeholderProps} display="flex" />
      </Box>
    </Flex>
  )
}
