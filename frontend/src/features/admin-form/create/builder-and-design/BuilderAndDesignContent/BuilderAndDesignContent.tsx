import { useCallback, useEffect } from 'react'
import { Flex } from '@chakra-ui/react'

import { useBgColor } from '~features/public-form/components/PublicFormWrapper'

import { DndPlaceholderProps } from '../types'
import {
  BuildFieldState,
  setToInactiveSelector,
  stateDataSelector,
  useBuilderAndDesignStore,
} from '../useBuilderAndDesignStore'
import { useDesignColorTheme } from '../utils/useDesignColorTheme'

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

  const bg = useBgColor({ colorTheme: useDesignColorTheme() })

  return (
    <Flex flex={1} bg={bg} overflow="auto">
      <EndPageView
        display={
          // Don't conditionally render EndPageView and FormBuilder because it
          // is expensive and takes time.
          stateData.state === BuildFieldState.EditingEndPage ? 'flex' : 'none'
        }
      />
      <FormBuilder
        placeholderProps={placeholderProps}
        display={
          stateData.state === BuildFieldState.EditingEndPage ? 'none' : 'flex'
        }
      />
    </Flex>
  )
}
