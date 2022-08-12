import { useCallback, useEffect } from 'react'
import { Flex } from '@chakra-ui/react'

import { DndPlaceholderProps } from '../types'
import {
  FieldBuilderState,
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
  const { stateData, setToInactive: setFieldsToInactive } =
    useFieldBuilderStore(
      useCallback(
        (state) => ({
          stateData: stateDataSelector(state),
          setToInactive: setToInactiveSelector(state),
        }),
        [],
      ),
    )

  useEffect(() => setFieldsToInactive, [setFieldsToInactive])

  return (
    <Flex flex={1} overflow="auto">
      <EndPageView
        display={
          // Don't conditionally render EndPageView and FormBuilder because it
          // is expensive and takes time.
          stateData.state === FieldBuilderState.EditingEndPage ? 'flex' : 'none'
        }
      />
      <FormBuilder
        placeholderProps={placeholderProps}
        display={
          stateData.state === FieldBuilderState.EditingEndPage ? 'none' : 'flex'
        }
      />
    </Flex>
  )
}
