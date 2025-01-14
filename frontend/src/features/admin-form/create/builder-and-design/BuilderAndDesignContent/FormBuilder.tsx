import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Flex,
  FlexProps,
  Skeleton,
  Stack,
  useDisclosure,
} from '@chakra-ui/react'
import { Droppable } from '@hello-pangea/dnd'

import Button from '~components/Button'

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
import {
  setToInactiveSelector as setPaymentToInactiveSelector,
  usePaymentStore,
} from '../BuilderAndDesignDrawer/FieldListDrawer/field-panels/usePaymentStore'
import { FIELD_LIST_DROP_ID } from '../constants'
import { DndPlaceholderProps } from '../types'
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
import { TextPromptModal } from './MagicFormBuilderModal'
import { PaymentView } from './PaymentView'
import { StartPageView } from './StartPageView'
import { useBuilderFields } from './useBuilderFields'

interface FormBuilderProps extends FlexProps {
  placeholderProps: DndPlaceholderProps
}

export const FormBuilder = ({
  placeholderProps,
  ...props
}: FormBuilderProps) => {
  const { t } = useTranslation()
  const { builderFields, isLoading } = useBuilderFields()
  const { data: form } = useAdminForm()
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

  const { isOpen, onClose, onOpen } = useDisclosure()

  const handleMagicFormButtonClick = onOpen

  const visibleFieldIds = useMemo(
    () =>
      getVisibleFieldIds(
        {}, // Assume form has no inputs yet.
        {
          formFields: builderFields ?? [],
          formLogics: form?.form_logics ?? [],
        },
      ),
    [builderFields, form?.form_logics],
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

  if (!form) return null

  return (
    <>
      <TextPromptModal isOpen={isOpen} onClose={onClose} />
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
                          responseMode={form?.responseMode}
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
                        onMagicFormButtonClick={handleMagicFormButtonClick}
                      />
                    )
                  }
                </Droppable>
              )}
            </Box>

            <PaymentView />
          </Flex>

          <Flex
            justify="center"
            w="100%"
            pt={{ base: '1rem', md: 0 }}
            px={{ base: '1rem', md: '1.5rem', lg: '2.5rem' }}
          >
            <Skeleton
              isLoaded={!isLoading}
              mb="1.5rem"
              maxW="57rem"
              width="100%"
            >
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
                {t('features.adminForm.sidebar.thankYou.thankYouPage.title')}
              </Button>
            </Skeleton>
          </Flex>
        </Stack>
      </Flex>
    </>
  )
}
