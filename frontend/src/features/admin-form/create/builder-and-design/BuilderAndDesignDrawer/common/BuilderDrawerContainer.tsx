import { ReactNode, useCallback } from 'react'
import { BiLeftArrowAlt } from 'react-icons/bi'
import { Stack, Text } from '@chakra-ui/react'
import { IconButton } from '@opengovsg/design-system-react'

import { CreatePageDrawerCloseButton } from '../../../common/CreatePageDrawer'
import { isDirtySelector, useDirtyFieldStore } from '../../useDirtyFieldStore'
import {
  setToInactiveSelector,
  useFieldBuilderStore,
} from '../../useFieldBuilderStore'

interface BuilderDrawerContainerProps {
  title: string
  children: ReactNode
}

export const BuilderDrawerContainer = ({
  title,
  children,
}: BuilderDrawerContainerProps): JSX.Element | null => {
  const isDirty = useDirtyFieldStore(isDirtySelector)
  const setToInactive = useFieldBuilderStore(setToInactiveSelector)

  const handleBack = useCallback(() => {
    setToInactive(isDirty)
  }, [isDirty, setToInactive])

  return (
    <>
      <Stack
        direction="row"
        pos="sticky"
        top={0}
        px="1.5rem"
        py="1rem"
        align="center"
        // TODO: Fix colors
        borderBottom="1px solid var(--chakra-colors-neutral-300)"
        bg="white"
      >
        <IconButton
          size="sm"
          h="1.5rem"
          w="1.5rem"
          aria-label="Back to field selection"
          variant="clear"
          colorScheme="sub"
          onClick={handleBack}
          icon={<BiLeftArrowAlt />}
        />
        <Text
          textStyle="h4"
          as="h4"
          color="brand.secondary.500"
          flex={1}
          textAlign="center"
        >
          Edit {title}
        </Text>
        <CreatePageDrawerCloseButton />
      </Stack>
      {children}
    </>
  )
}
