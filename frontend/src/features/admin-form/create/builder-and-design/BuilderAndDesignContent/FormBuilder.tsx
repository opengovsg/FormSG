import { Droppable } from 'react-beautiful-dnd'
import { Box, Flex, FlexProps, Text } from '@chakra-ui/react'

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
      bg={bg}
      p={{ base: '1.5rem', md: '2.5rem' }}
      justify="center"
      overflow="auto"
      {...props}
    >
      <Flex flexDir="column" w="100%" maxW="57rem" h="fit-content">
        <StartPageView />
        <Flex bg="white" p={{ base: 0, md: '2.5rem' }} flexDir="column">
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
                  m={{ base: '1.5rem', md: 0 }}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  isDraggingOver={snapshot.isDraggingOver}
                  onClick={handleBuilderClick}
                />
              )
            }
          </Droppable>
        </Flex>
        <Button
          _hover={{ bg: 'primary.200' }}
          py="1.5rem"
          mt="1.5rem"
          variant="outline"
          borderColor="secondary.200"
          colorScheme="secondary"
          height="auto"
          onClick={() => {
            setEditEndPage()
            handleBuilderClick()
          }}
        >
          <Text textStyle="subhead-2">Customise Thank you page</Text>
        </Button>
      </Flex>
    </Flex>
  )
}
