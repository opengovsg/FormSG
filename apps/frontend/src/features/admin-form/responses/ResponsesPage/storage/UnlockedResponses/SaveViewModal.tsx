import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  ButtonGroup,
  FormControl,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import { ModalCloseButton } from '~components/Modal'

const VIEW_NAME_MIN_LENGTH = 4
const VIEW_NAME_MAX_LENGTH = 200

interface SaveViewModalProps extends Pick<
  UseDisclosureReturn,
  'isOpen' | 'onClose'
> {
  onSave?: (viewName: string) => void
}

export const SaveViewModal = ({
  isOpen,
  onClose,
  onSave,
}: SaveViewModalProps): JSX.Element => {
  const { t } = useTranslation()
  const {
    saveAsNewView,
    viewName,
    viewNamePlaceholder,
    viewNameRequired,
    viewNameMinLength,
    viewNameMaxLength,
  } = t(
    'features.adminForm.responses.responsesPage.storage.unlockedResponses.views',
    { returnObjects: true },
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ viewName: string }>({
    defaultValues: { viewName: '' },
  })

  const nameValidationRules = {
    validate: (value: string) => {
      const trimmed = value.trim()
      if (!trimmed) return viewNameRequired
      if (trimmed.length < VIEW_NAME_MIN_LENGTH) {
        return viewNameMinLength.replace(
          '{MIN_LENGTH}',
          String(VIEW_NAME_MIN_LENGTH),
        )
      }
      if (trimmed.length > VIEW_NAME_MAX_LENGTH) {
        return viewNameMaxLength.replace(
          '{MAX_LENGTH}',
          String(VIEW_NAME_MAX_LENGTH),
        )
      }
      return true
    },
  }

  const onSubmit = handleSubmit(({ viewName: name }) => {
    onSave?.(name.trim())
    onClose()
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} onCloseComplete={() => reset()}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader>{saveAsNewView}</ModalHeader>
        <ModalBody>
          <form id="save-view-form" onSubmit={onSubmit}>
            <FormControl isInvalid={!!errors.viewName}>
              <FormLabel isRequired>{viewName}</FormLabel>
              <Input
                autoFocus
                placeholder={viewNamePlaceholder}
                {...register('viewName', nameValidationRules)}
              />
              <FormErrorMessage>{errors.viewName?.message}</FormErrorMessage>
            </FormControl>
          </form>
        </ModalBody>
        <ModalFooter>
          <ButtonGroup spacing="1rem">
            <Button variant="clear" colorScheme="secondary" onClick={onClose}>
              {t('features.common.cancel')}
            </Button>
            <Button type="submit" form="save-view-form">
              {t('features.common.save')}
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
