import { useCallback, useEffect } from 'react'
import { Box, Flex } from '@chakra-ui/react'

import InlineMessage from '~components/InlineMessage'

import { useAdminFormSettings } from '~features/admin-form/settings/queries'

import { DndPlaceholderProps } from '../types'
import {
  FieldBuilderState,
  fieldBuilderStateSelector,
  setToInactiveSelector,
  stateDataSelector,
  useFieldBuilderStore,
} from '../useFieldBuilderStore'

import { EndPageView } from './EndPageView'
import { FormBuilder } from './FormBuilder'

interface BuilderAndDesignContentProps {
  placeholderProps: DndPlaceholderProps
}

export const BuilderAndDesignContent = ({
  placeholderProps,
}: BuilderAndDesignContentProps): JSX.Element => {
  const { data: settings } = useAdminFormSettings()

  const fieldBuilderState = useFieldBuilderStore(fieldBuilderStateSelector)
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
        <EndPageView
          display={
            // Don't conditionally render EndPageView and FormBuilder because it
            // is expensive and takes time.
            fieldBuilderState === FieldBuilderState.EditingEndPage
              ? 'flex'
              : 'none'
          }
        />
        <FormBuilder
          placeholderProps={placeholderProps}
          display={
            fieldBuilderState === FieldBuilderState.EditingEndPage
              ? 'none'
              : 'flex'
          }
        />
      </Box>
    </Flex>
  )
}
