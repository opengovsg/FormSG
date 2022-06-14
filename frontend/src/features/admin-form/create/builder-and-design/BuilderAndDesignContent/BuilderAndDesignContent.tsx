import { useCallback, useEffect } from 'react'
import { Droppable } from 'react-beautiful-dnd'
import { Box, Flex, Image, Stack, Text } from '@chakra-ui/react'

import Button from '~components/Button'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useCreatePageSidebar } from '../../common/CreatePageSidebarContext'
import {
  endPageDataSelector,
  useEndPageBuilderStore,
} from '../BuilderAndDesignDrawer/EditEndPageDrawer/useEndPageBuilderStore'
import { FIELD_LIST_DROP_ID } from '../constants'
import { DndPlaceholderProps } from '../types'
import {
  BuildFieldState,
  setToEditEndPageSelector,
  setToInactiveSelector,
  stateDataSelector,
  useBuilderAndDesignStore,
} from '../useBuilderAndDesignStore'

import { EmptyFormPlaceholder } from './BuilderAndDesignPlaceholder/EmptyFormPlaceholder'
import BuilderAndDesignPlaceholder from './BuilderAndDesignPlaceholder'
import { BuilderFields } from './BuilderFields'
import { useBuilderFields } from './useBuilderFields'

interface BuilderAndDesignContentProps {
  placeholderProps: DndPlaceholderProps
}

export const BuilderAndDesignContent = ({
  placeholderProps,
}: BuilderAndDesignContentProps): JSX.Element => {
  const { builderFields } = useBuilderFields()
  const { data: form } = useAdminForm()
  const { handleBuilderClick } = useCreatePageSidebar()
  const {
    stateData,
    setEditEndPage,
    setToInactive: setFieldsToInactive,
  } = useBuilderAndDesignStore(
    useCallback(
      (state) => ({
        stateData: stateDataSelector(state),
        setToInactive: setToInactiveSelector(state),
        setEditEndPage: setToEditEndPageSelector(state),
      }),
      [],
    ),
  )
  const endPageData = useEndPageBuilderStore(endPageDataSelector)

  useEffect(() => setFieldsToInactive, [setFieldsToInactive])

  const FormBuilder = (): JSX.Element => (
    <Flex
      m={{ base: 0, md: '2rem' }}
      mb={0}
      flex={1}
      bg={{ base: 'secondary.100', md: 'primary.100' }}
      p={{ base: '1.5rem', md: '2.5rem' }}
      justify="center"
      overflow="auto"
    >
      <Flex
        h="fit-content"
        bg="white"
        p={{ base: 0, md: '2.5rem' }}
        maxW="57rem"
        w="100%"
        flexDir="column"
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
        <Button
          py="1.5rem"
          mt="1.5rem"
          variant="outline"
          colorScheme="secondary"
          onClick={() => {
            setEditEndPage()
            handleBuilderClick()
          }}
        >
          <Text textStyle="subhead-2">Thank you</Text>
        </Button>
      </Flex>
    </Flex>
  )

  // TODO (hans): Complete end page view
  const EndPageView = (): JSX.Element => (
    <Flex
      m={{ base: 0, md: '2rem' }}
      mb={0}
      flex={1}
      bg="white"
      p={{ base: '1.5rem', md: '2.5rem' }}
      justify="center"
      overflow="auto"
    >
      <Stack w="100%" px="1.5rem">
        <Image src={form?.admin.agency.logo} h="10%" />

        <Box>
          <Text textStyle="h2" color="secondary.500">
            {endPageData.title}
          </Text>
          <Text textStyle="subhead-1" color="secondary.500" mt="1rem">
            {endPageData.paragraph}
          </Text>
        </Box>

        <Box>
          <Text>Staff Travel Declarations</Text>
          <Text>FormID</Text>
          <Text>Date</Text>
        </Box>

        <Flex pt="1.75rem" gap="2rem">
          <Button>Save this response</Button>
          <Button variant="clear">{endPageData.buttonText}</Button>
        </Flex>
      </Stack>
    </Flex>
  )

  return (
    <>
      <Flex flex={1} bg="neutral.200" overflow="auto">
        {stateData.state === BuildFieldState.EditingEndPage ? (
          <EndPageView />
        ) : (
          <FormBuilder />
        )}
      </Flex>
    </>
  )
}
