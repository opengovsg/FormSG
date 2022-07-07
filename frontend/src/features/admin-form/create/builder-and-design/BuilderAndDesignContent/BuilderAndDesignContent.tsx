import { useCallback, useEffect } from 'react'
import { Droppable } from 'react-beautiful-dnd'
import { Box, Flex, FlexProps, Image, Stack, Text } from '@chakra-ui/react'
import { format } from 'date-fns'

import { BxsChevronUp } from '~assets/icons/BxsChevronUp'
import Button from '~components/Button'

import { useAdminForm } from '~features/admin-form/common/queries'
import { ThankYouSvgr } from '~features/public-form/components/FormEndPage/components/ThankYouSvgr'

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

interface FormBuilderProps extends FlexProps {
  placeholderProps: DndPlaceholderProps
}

const FormBuilder = ({
  placeholderProps,
  ...props
}: FormBuilderProps): JSX.Element => {
  const { builderFields } = useBuilderFields()
  const { handleBuilderClick } = useCreatePageSidebar()
  const setEditEndPage = useBuilderAndDesignStore(setToEditEndPageSelector)

  return (
    <Flex
      m={{ base: 0, md: '2rem' }}
      mb={0}
      flex={1}
      bg={{ base: 'secondary.100', md: 'primary.100' }}
      p={{ base: '1.5rem', md: '2.5rem' }}
      justify="center"
      overflow="auto"
      {...props}
    >
      <Flex flexDir="column" w="100%" maxW="57rem" h="fit-content">
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
          py="1.5rem"
          mt="1.5rem"
          variant="outline"
          borderColor="secondary.200"
          colorScheme="secondary"
          onClick={() => {
            setEditEndPage()
            handleBuilderClick()
          }}
        >
          <Text textStyle="subhead-2">Customise your Thank you page</Text>
        </Button>
      </Flex>
    </Flex>
  )
}

const EndPageView = ({ ...props }: FlexProps): JSX.Element => {
  const { data: form } = useAdminForm()
  const endPageData = useEndPageBuilderStore(endPageDataSelector)

  return (
    <Flex
      m={{ base: 0, md: '2rem' }}
      mb={0}
      flex={1}
      bg="white"
      p={{ base: '1.5rem', md: 0 }}
      justify="center"
      overflow="auto"
      {...props}
    >
      <Stack w="100%">
        <Flex justifyContent="center" pt="1rem" pb="0.5rem">
          <Image src={form?.admin?.agency?.logo} h="4rem" />
        </Flex>
        <Flex backgroundColor="primary.100" justifyContent="center">
          <ThankYouSvgr h="100%" pt="2.5rem" />
        </Flex>

        <Box px="4rem" pt="3rem">
          <Flex justifyContent="space-between" alignItems="center">
            <Text textStyle="h2" color="secondary.500">
              {endPageData.title}
            </Text>
            <BxsChevronUp color="secondary.500" />
          </Flex>

          <Text textStyle="subhead-1" color="secondary.500" mt="1rem">
            {endPageData.paragraph}
          </Text>

          <Text textStyle="subhead-1" color="secondary.500" mt="2.25rem">
            {form?.title ?? 'Form Title'}
          </Text>
          <Text textStyle="body-1" color="neutral.500">
            {form?._id ?? 'Form Identification Number'}
            <br />
            {format(new Date(), 'dd MMM yyyy, h:m aa')}
          </Text>

          <Flex pt="1.75rem" gap="2rem">
            <Button>Save this response</Button>
            <Button variant="clear">{endPageData.buttonText}</Button>
          </Flex>
        </Box>
      </Stack>
    </Flex>
  )
}
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
    <>
      <Flex flex={1} bg="neutral.200" overflow="auto">
        <EndPageView
          display={
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
    </>
  )
}
