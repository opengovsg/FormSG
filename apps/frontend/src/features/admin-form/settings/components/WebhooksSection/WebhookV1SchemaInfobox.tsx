import { Text, useDisclosure } from '@chakra-ui/react'

import { FormId } from 'formsg-shared/types/form/form'

import InlineMessage from '~components/InlineMessage'
import Link from '~components/Link'

import { DuplicateFormModal } from '~features/workspace/components/DuplicateFormModal'

interface WebhookV1SchemaInfoboxProps {
  formId: FormId
}

export const WebhookV1SchemaInfobox = ({
  formId,
}: WebhookV1SchemaInfoboxProps): JSX.Element => {
  const dupeModal = useDisclosure()

  return (
    <>
      <InlineMessage variant="info">
        <Text>
          This form uses webhooks v1, which will be deprecated in 2027. Switch
          to the{' '}
          <Link cursor="pointer" onClick={dupeModal.onOpen}>
            latest version of FormSG
          </Link>{' '}
          early unless your system requires v1.
        </Text>
      </InlineMessage>
      <DuplicateFormModal
        isOpen={dupeModal.isOpen}
        onClose={dupeModal.onClose}
        formIdToDuplicate={formId}
      />
    </>
  )
}
