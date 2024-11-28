import { useCallback, useEffect, useRef } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BiCog, BiTrash } from 'react-icons/bi'
import { Box, ButtonGroup, Collapse, Flex } from '@chakra-ui/react'

import { FormFieldDto, FormResponseMode } from '~shared/types'

import { useIsMobile } from '~hooks/useIsMobile'
import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'
import { PaymentPreview } from '~templates/Field/PaymentPreview/PaymentPreview'

import { useAdminForm } from '~features/admin-form/common/queries'
import { useDesignColorTheme } from '~features/admin-form/create/builder-and-design/utils/useDesignColorTheme'

import {
  CreatePageSidebarContextProps,
  useCreatePageSidebar,
} from '../../common/CreatePageSidebarContext'
import { useBuilderAndDesignContext } from '../BuilderAndDesignContext'
import {
  dataSelector,
  PaymentState,
  setToEditingPaymentSelector,
  stateSelector,
  usePaymentStore,
} from '../BuilderAndDesignDrawer/FieldListDrawer/field-panels/usePaymentStore'
import { FieldListTabIndex } from '../constants'
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

export const PaymentView = () => {
  const { data: form } = useAdminForm()
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
  const isDirty = useDirtyFieldStore(isDirtySelector)

  const isMobile = useIsMobile()

  const formMethods = useForm<FormFieldDto>({
    mode: 'onChange',
  })

  const paymentRef = useRef<HTMLDivElement | null>(null)
  const colourTheme = useDesignColorTheme()

  useEffect(() => {
    if (paymentState === PaymentState.EditingPayment) {
      paymentRef.current?.scrollIntoView({ block: 'nearest' })
    }
  }, [paymentState])

  if (form?.responseMode !== FormResponseMode.Encrypt) return null

  const isActive = paymentState === PaymentState.EditingPayment

  const paymentDetails = paymentFromStore ?? form.payments_field

  const isDirtyAndPaymentInactive =
    isDirty && paymentState === PaymentState.Inactive

  const handlePaymentClick = () => {
    if (isDirtyAndPaymentInactive) {
      return setToEditingPayment(true)
    }

    setToEditingPayment()
    setFieldBuilderToInactive()
    setDesignState(DesignState.Inactive)

    if (!isMobile) handleBuilderClick(false)
    setFieldListTabIndex(FieldListTabIndex.Payments)
  }

  // if payment isn't enabled or payment builder isn't opened
  if (!paymentDetails.enabled && paymentState !== PaymentState.EditingPayment)
    return null

  const paymentDetailsWithPlaceholderPreview: typeof paymentDetails = {
    ...paymentDetails,
    name: paymentDetails.name || 'Product/service name',
  }
  return (
    <Box w="100%" maxW="57rem" alignSelf="center" ref={paymentRef}>
      <FormProvider {...formMethods}>
        <Box mt="2.5rem" bg="white" py="2.5rem" px="1.5rem">
          <Box
            transition="background 0.2s ease"
            _hover={{ bg: 'secondary.100', cursor: 'pointer' }}
            borderRadius="4px"
            _active={{
              bg: 'secondary.100',
              boxShadow: '0 0 0 2px var(--chakra-colors-primary-500)',
            }}
            data-active={isActive || undefined}
            onClick={handlePaymentClick}
          >
            <Box p={{ base: '0.75rem', md: '1.5rem' }}>
              <PaymentPreview
                colorTheme={colourTheme}
                paymentDetails={paymentDetailsWithPlaceholderPreview}
                isBuilder
              />
            </Box>
            <Collapse in={isActive} style={{ width: '100%' }}>
              {isActive && paymentDetails.enabled && (
                <PaymentButtonGroup
                  isMobile={isMobile}
                  handleBuilderClick={handleBuilderClick}
                />
              )}
            </Collapse>
          </Box>
        </Box>
      </FormProvider>
    </Box>
  )
}

const PaymentButtonGroup = ({
  isMobile,
  handleBuilderClick,
}: {
  isMobile: boolean
  handleBuilderClick: CreatePageSidebarContextProps['handleBuilderClick']
}) => {
  const handleEditFieldClick = useCallback(() => {
    if (isMobile) {
      handleBuilderClick(false)
    }
  }, [handleBuilderClick, isMobile])
  const { t } = useTranslation()

  const {
    deletePaymentModalDisclosure: { onOpen: onDeleteModalOpen },
  } = useBuilderAndDesignContext()

  const { deleteField, editField } = t('features.common.tooltip', {
    returnObjects: true,
  })

  return (
    <Flex
      px={{ base: '0.75rem', md: '1.5rem' }}
      flex={1}
      borderTop="1px solid var(--chakra-colors-neutral-300)"
      justify="flex-end"
    >
      <ButtonGroup variant="clear" colorScheme="secondary" spacing={0}>
        {isMobile && (
          <IconButton
            variant="clear"
            colorScheme="secondary"
            aria-label={editField}
            icon={<BiCog fontSize="1.25rem" />}
            onClick={handleEditFieldClick}
          />
        )}
        <Tooltip label={deleteField}>
          <IconButton
            colorScheme="danger"
            aria-label={deleteField}
            icon={<BiTrash fontSize="1.25rem" />}
            onClick={onDeleteModalOpen}
          />
        </Tooltip>
      </ButtonGroup>
    </Flex>
  )
}
