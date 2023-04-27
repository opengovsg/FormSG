import { useCallback, useMemo } from 'react'
import { Droppable } from 'react-beautiful-dnd'
import { FormProvider, useForm } from 'react-hook-form'
import { Box, Flex, FlexProps, Skeleton, Stack } from '@chakra-ui/react'

import { FormFieldDto, FormResponseMode } from '~shared/types'

import Button from '~components/Button'
import { PaymentPreview } from '~templates/Field/PaymentPreview/PaymentPreview'

import { useAdminForm } from '~features/admin-form/common/queries'
import { getVisibleFieldIds } from '~features/logic/utils'
import { useBgColor } from '~features/public-form/components/PublicFormWrapper'

import { useCreatePageSidebar } from '../../common/CreatePageSidebarContext'
import {
  EndPageState,
  setToEditingEndPageSelector,
  stateSelector as endPageStateSelector,
  useEndPageStore,
} from '../../end-page/useEndPageStore'
import { useAdminFormLogic } from '../../logic/hooks/useAdminFormLogic'
import { useBuilderAndDesignContext } from '../BuilderAndDesignContext'
import {
  dataSelector,
  PaymentState,
  setToEditingPaymentSelector,
  setToInactiveSelector as setPaymentToInactiveSelector,
  stateSelector,
  usePaymentStore,
} from '../BuilderAndDesignDrawer/FieldListDrawer/field-panels/usePaymentStore'
import { FIELD_LIST_DROP_ID, FieldListTabIndex } from '../constants'
import { DndPlaceholderProps } from '../types'
import {
  DesignState,
  setStateSelector as setDesignStateSelector,
  useDesignStore,
} from '../useDesignStore'
import { isDirtySelector, useDirtyFieldStore } from '../useDirtyFieldStore'
import {
  setToInactiveSelector as setFieldBuilderToInactiveSelector,
  useFieldBuilderStore,
} from '../useFieldBuilderStore'
import { useDesignColorTheme } from '../utils/useDesignColorTheme'

import { EmptyFormPlaceholder } from './BuilderAndDesignPlaceholder/EmptyFormPlaceholder'
import { FormBuilderFieldsSkeleton } from './FormBuilder/FormBuilderFieldsSkeleton'
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
  const { builderFields, isLoading } = useBuilderFields()
  const { formLogics } = useAdminFormLogic()
  const { handleBuilderClick, handleEndpageClick } = useCreatePageSidebar()
  const setFieldBuilderToInactive = useFieldBuilderStore(
    setFieldBuilderToInactiveSelector,
  )
  const setPaymentToInactive = usePaymentStore(setPaymentToInactiveSelector)
  const isDirty = useDirtyFieldStore(isDirtySelector)
  const { endPageState, setEditingEndPageState } = useEndPageStore((state) => ({
    endPageState: endPageStateSelector(state),
    setEditingEndPageState: setToEditingEndPageSelector(state),
  }))

  const visibleFieldIds = useMemo(
    () =>
      getVisibleFieldIds(
        {}, // Assume form has no inputs yet.
        { formFields: builderFields ?? [], formLogics: formLogics ?? [] },
      ),
    [builderFields, formLogics],
  )

  const handlePlaceholderClick = useCallback(
    () => handleBuilderClick(false),
    [handleBuilderClick],
  )

  const isDirtyAndEndPageInactive = useMemo(
    () => isDirty && endPageState === EndPageState.Inactive,
    [endPageState, isDirty],
  )

  const handleEditEndPageClick = () => {
    if (isDirtyAndEndPageInactive) {
      return setEditingEndPageState(true)
    }

    setEditingEndPageState()
    setFieldBuilderToInactive()
    setPaymentToInactive()
    handleEndpageClick(false)
  }

  const bg = useBgColor({ colorTheme: useDesignColorTheme() })

  return (
    <Flex
      mb={0}
      flex={1}
      bg="neutral.200"
      // Using margin for margin collapse when there are inline messages above.
      mt={{ base: 0, md: '1rem' }}
      pt={{ base: 0, md: '1rem' }}
      pb={{ base: 0, md: '2rem' }}
      px={{ base: 0, md: '2rem' }}
      justify="center"
      {...props}
    >
      <Stack
        direction="column"
        w="100%"
        h="fit-content"
        spacing={{ base: 0, md: '1.5rem' }}
        bg={bg}
      >
        <StartPageView />
        <Flex
          flexDir="column"
          alignSelf="center"
          w="100%"
          px={{ base: 0, md: '1.5rem', lg: '2.5rem' }}
        >
          <Box
            bg="white"
            w="100%"
            maxW="57rem"
            alignSelf="center"
            px={{ base: '1.5rem', md: '1.625rem' }}
            py={{ base: '1.5rem', md: '2.5rem' }}
          >
            {isLoading || !builderFields ? (
              <FormBuilderFieldsSkeleton />
            ) : (
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
                        visibleFieldIds={visibleFieldIds}
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
                      onClick={handlePlaceholderClick}
                    />
                  )
                }
              </Droppable>
            )}
          </Box>

          <PaymentPreviewBuilder />
        </Flex>

        <Flex
          justify="center"
          w="100%"
          pt={{ base: '1rem', md: 0 }}
          px={{ base: '1rem', md: '1.5rem', lg: '2.5rem' }}
        >
          <Skeleton isLoaded={!isLoading} mb="1.5rem" maxW="57rem" width="100%">
            <Button
              _hover={{ bg: 'primary.200' }}
              py="1.5rem"
              width="100%"
              variant="outline"
              borderColor="secondary.200"
              colorScheme="secondary"
              height="auto"
              onClick={handleEditEndPageClick}
              textStyle="subhead-2"
            >
              Customise Thank you page
            </Button>
          </Skeleton>
        </Flex>
      </Stack>
    </Flex>
  )
}

const PaymentPreviewBuilder = () => {
  const { data: form } = useAdminForm()
  const { paymentPreviewRef } = useBuilderAndDesignContext()
  const { handleBuilderClick, setFieldListTabIndex } = useCreatePageSidebar()
  const { paymentFromStore, paymentState, setToEditingPayment } =
    usePaymentStore((state) => ({
      paymentFromStore: dataSelector(state),
      paymentState: stateSelector(state),
      setToEditingPayment: setToEditingPaymentSelector(state),
    }))

  const setFieldBuilderToInactive = useFieldBuilderStore(
    setFieldBuilderToInactiveSelector,
  )
  const setDesignState = useDesignStore(setDesignStateSelector)

  const formMethods = useForm<FormFieldDto>({
    mode: 'onChange',
  })

  if (form?.responseMode !== FormResponseMode.Encrypt) return null

  const isActive = paymentState === PaymentState.EditingPayment

  const paymentDetails = paymentFromStore ?? form.payments_field

  const handlePaymentClick = () => {
    setToEditingPayment()
    setFieldBuilderToInactive()
    setDesignState(DesignState.Inactive)

    handleBuilderClick(false)
    setFieldListTabIndex(FieldListTabIndex.Payments)
  }

  return (
    <Box w="100%" maxW="57rem" alignSelf="center" ref={paymentPreviewRef}>
      <FormProvider {...formMethods}>
        <PaymentPreview
          colorTheme={form?.startPage.colorTheme}
          paymentDetails={paymentDetails}
          isBuilder
          isActive={isActive}
          onClick={handlePaymentClick}
        />
      </FormProvider>
    </Box>
  )
}
