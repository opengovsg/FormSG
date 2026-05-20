import { useCallback, useMemo, useState } from 'react'
import {
  ButtonGroup,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Textarea,
} from '@chakra-ui/react'

import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

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
): string {
  return options
    .map((opt) => {
      const emails = mapping?.[opt]
      return emails?.length ? `${opt}: ${emails.join(', ')}` : `${opt}: `
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
  const initialText = useMemo(
    () => buildInitialText(options, initialMapping),
    [options, initialMapping],
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
        <ModalHeader>Map emails to dropdown options</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text color="secondary.500" mb="1rem">
            For each dropdown option, add the email addresses that should
            receive the form (comma-separated). Do not change the text before
            the colon.
          </Text>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={Math.max(options.length + 1, 5)}
          />
        </ModalBody>
        <ModalFooter>
          <ButtonGroup>
            <Button variant="clear" colorScheme="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="primary" onClick={handleSave}>
              Save mapping
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
