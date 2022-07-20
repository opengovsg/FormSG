import { ReactNode } from 'react'
import { BiLeftArrowAlt } from 'react-icons/bi'
import { Stack, Text } from '@chakra-ui/react'

import IconButton from '~components/IconButton'

import {
  setToInactiveSelector,
  useBuilderAndDesignStore,
} from '../../useBuilderAndDesignStore'
import { CreatePageDrawerCloseButton } from '../CreatePageDrawerCloseButton'

interface BuilderDrawerContainerProps {
  title: string
  children: ReactNode
}

export const BuilderDrawerContainer = ({
  title,
  children,
}: BuilderDrawerContainerProps): JSX.Element | null => {
  const setToInactive = useBuilderAndDesignStore(setToInactiveSelector)

  return (
    <>
      <Stack
        direction="row"
        pos="sticky"
        top={0}
        px="1.5rem"
        py="1rem"
        align="center"
        borderBottom="1px solid var(--chakra-colors-neutral-300)"
        bg="white"
      >
        <IconButton
          size="sm"
          h="1.5rem"
          w="1.5rem"
          aria-label="Back to field selection"
          variant="clear"
          colorScheme="secondary"
          onClick={setToInactive}
          icon={<BiLeftArrowAlt />}
        />
        <Text
          textStyle="h4"
          as="h4"
          color="secondary.500"
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
