import { Droppable } from 'react-beautiful-dnd'
import { Box, Flex, FlexProps, Stack } from '@chakra-ui/react'

import Button from '~components/Button'

import { useBgColor } from '~features/public-form/components/PublicFormWrapper'

import { useCreatePageSidebar } from '../../common/CreatePageSidebarContext'
import { FIELD_LIST_DROP_ID } from '../constants'
import { DndPlaceholderProps } from '../types'
import {
  setToEditEndPageSelector,
  useBuilderAndDesignStore,
} from '../useBuilderAndDesignStore'
import { useDesignColorTheme } from '../utils/useDesignColorTheme'

import { EmptyFormPlaceholder } from './BuilderAndDesignPlaceholder/EmptyFormPlaceholder'
import BuilderAndDesignPlaceholder from './BuilderAndDesignPlaceholder'
import { BuilderFields } from './BuilderFields'
import { StartPageView } from './StartPageView'
import { useBuilderFields } from './useBuilderFields'

interface FormBuilderProps extends FlexProps {
  placeholderProps: DndPlaceholderProps
}

export const FormBuilder = ({
  placeholderProps,
  ...props
}: FormBuilderProps): JSX.Element => {
  const { builderFields } = useBuilderFields()
  const { handleBuilderClick } = useCreatePageSidebar()
  const setEditEndPage = useBuilderAndDesignStore(setToEditEndPageSelector)

  const bg = useBgColor(useDesignColorTheme())

  return (
    <Flex
      mb={0}
      flex={1}
      bg="neutral.200"
      p={{ base: 0, md: '2rem' }}
      justify="center"
      overflow="auto"
      {...props}
    >
      <Stack
        direction="column"
        w="100%"
        h="fit-content"
        spacing="1.5rem"
        bg={bg}
      >
        <StartPageView />
        <Flex flexDir="column" alignSelf="center" w="100%" px="2.5rem">
          <Box
            bg="white"
            w="100%"
            maxW="57rem"
            alignSelf="center"
            px="1.625rem"
            py="2.5rem"
          >
            <Droppable droppableId={FIELD_LIST_DROP_ID}>
              {(provided, snapshot) =>
                builderFields?.length ? (
                  <Box
                    pos="relative"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    <BuilderFields
                      fields={builderFields}
                      isDraggingOver={snapshot.isDraggingOver}
                    />
                    {provided.placeholder}
                    <BuilderAndDesignPlaceholder
                      placeholderProps={placeholderProps}
                      isDraggingOver={snapshot.isDraggingOver}
                    />
                  </Box>
                ) : (
                  <EmptyFormPlaceholder
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    isDraggingOver={snapshot.isDraggingOver}
                    onClick={handleBuilderClick}
                  />
                )
              }
            </Droppable>
          </Box>
        </Flex>
        <Flex justify="center" w="100%" px="2.5rem">
          <Button
            _hover={{ bg: 'primary.200' }}
            py="1.5rem"
            mb="1.5rem"
            variant="outline"
            borderColor="secondary.200"
            colorScheme="secondary"
            height="auto"
            maxW="57rem"
            width="100%"
            onClick={() => {
              setEditEndPage()
              handleBuilderClick()
            }}
            textStyle="subhead-2"
          >
            Customise Thank you page
          </Button>
        </Flex>
      </Stack>
    </Flex>
  )
}
