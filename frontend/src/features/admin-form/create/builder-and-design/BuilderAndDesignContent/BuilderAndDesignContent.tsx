import { useCallback, useEffect } from 'react'
import { Flex } from '@chakra-ui/react'

import { DndPlaceholderProps } from '../types'
import {
  BuildFieldState,
  setToInactiveSelector,
  stateDataSelector,
  useBuilderAndDesignStore,
} from '../useBuilderAndDesignStore'

import { EndPageView } from './EndPageView'
import { FormBuilder } from './FormBuilder'

interface BuilderAndDesignContentProps {
  placeholderProps: DndPlaceholderProps
}

export const BuilderAndDesignContent = ({
  placeholderProps,
}: BuilderAndDesignContentProps): JSX.Element => {
  const { stateData, setToInactive: setFieldsToInactive } =
    useBuilderAndDesignStore(
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
    <Flex flex={1} bg="neutral.200" overflow="auto">
      {stateData.state === BuildFieldState.EditingEndPage ? (
        <EndPageView />
      ) : (
        <FormBuilder placeholderProps={placeholderProps} />
      )}
    </Flex>
  )
}
