import { useCallback, useMemo, useState } from 'react'
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react'

import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

import { useUser } from '~features/user/queries'

type OptionEmailMappingModalProps = {
  isOpen: boolean
  onClose: () => void
  options: string[]
  initialMapping?: Record<string, string[]>
  onSave: (mapping: Record<string, string[]>) => void
}

function buildInitialText(
  options: string[],
  mapping?: Record<string, string[]>,
  defaultEmail?: string,
): string {
  return options
    .map((opt, i) => {
      const emails = mapping?.[opt]
      if (emails?.length) return `${opt}: ${emails.join(', ')}`
      // Prefill the first option with the owner's email
      if (i === 0 && defaultEmail) return `${opt}: ${defaultEmail}`
      return `${opt}: `
    })
    .join('\n')
}

function parseMapping(text: string): Record<string, string[]> {
  const map: Record<string, string[]> = {}
  text.split('\n').forEach((line) => {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) return
    const option = line.slice(0, colonIdx).trim()
    const emailsPart = line.slice(colonIdx + 1).trim()
    if (option) {
      map[option] = emailsPart
        ? emailsPart
            .split(',')
            .map((e) => e.trim())
            .filter(Boolean)
        : []
    }
  })
  return map
}

export const OptionEmailMappingModal = ({
  isOpen,
  onClose,
  options,
  initialMapping,
  onSave,
}: OptionEmailMappingModalProps): JSX.Element => {
  const { user } = useUser()

  const initialText = useMemo(
    () => buildInitialText(options, initialMapping, user?.email),
    [options, initialMapping, user?.email],
  )
  const [text, setText] = useState(initialText)

  const handleSave = useCallback(() => {
    onSave(parseMapping(text))
    onClose()
  }, [text, onSave, onClose])

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader color="secondary.700" pr="4rem">
          Map emails to dropdown options
        </ModalHeader>
        <ModalBody>
          <Text textStyle="body-2" color="secondary.500" mb="1rem">
            For each dropdown option, add the email addresses that should
            receive the form. Separate multiple emails with commas.
          </Text>
          <Text textStyle="body-2" color="secondary.500" mb="1rem">
            Example: <br />
            Engineering: alice@open.gov.sg <br />
            Design: bob@open.gov.sg, carol@open.gov.sg
          </Text>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={Math.max(options.length + 1, 5)}
          />
        </ModalBody>
        <ModalFooter>
          <Stack
            direction={{ base: 'column-reverse', md: 'row' }}
            w="100%"
            justify="flex-end"
          >
            <Button variant="clear" colorScheme="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="primary" onClick={handleSave}>
              Save mapping
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
