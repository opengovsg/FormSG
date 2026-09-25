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
import FormLabel from '~components/FormControl/FormLabel'
import { ModalCloseButton } from '~components/Modal'

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
  const { t: tCommon } = useTranslation()
  const { saveAsNewView, viewName, viewNamePlaceholder } = t(
    'features.adminForm.responses.responsesPage.storage.unlockedResponses.views',
    { returnObjects: true },
  )

  const { register, handleSubmit, reset } = useForm<{ viewName: string }>({
    defaultValues: { viewName: '' },
  })

  const onSubmit = handleSubmit(({ viewName: name }) => {
    onSave?.(name)
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
            <FormControl>
              <FormLabel isRequired>{viewName}</FormLabel>
              <Input
                autoFocus
                placeholder={viewNamePlaceholder}
                {...register('viewName')}
              />
            </FormControl>
          </form>
        </ModalBody>
        <ModalFooter>
          <ButtonGroup spacing="1rem">
            <Button variant="clear" colorScheme="secondary" onClick={onClose}>
              {tCommon('features.common.cancel')}
            </Button>
            <Button type="submit" form="save-view-form">
              {tCommon('features.common.save')}
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
