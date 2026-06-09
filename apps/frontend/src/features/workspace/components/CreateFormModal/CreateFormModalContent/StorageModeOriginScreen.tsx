import { useState } from 'react'
import { BiRightArrowAlt } from 'react-icons/bi'
import {
  Box,
  Container,
  FormControl,
  ModalBody,
  ModalHeader,
  Stack,
  Text,
} from '@chakra-ui/react'

import Button from '~components/Button'
import Checkbox from '~components/Checkbox'
import Input from '~components/Input'

import {
  FormOriginValue,
  OriginSelection,
} from '../../CreateFormFlowV2/OriginSelection'
import { useCreateFormWizard } from '../CreateFormWizardContext'

const STORAGE_MODE_REASONS = [
  { value: 'payments', label: 'I want to collect payments' },
  { value: 'myinfo_children', label: 'I want to use MyInfo Children fields' },
  { value: 'webhooks', label: 'I want to use webhooks with Plumber' },
  { value: 'others', label: 'Others' },
]

export const StorageModeOriginScreen = (): JSX.Element => {
  const { goToLanding } = useCreateFormWizard()

  const [storageReasons, setStorageReasons] = useState<string[]>([])
  const [storageOthersText, setStorageOthersText] = useState('')
  const [originSelected, setOriginSelected] = useState<FormOriginValue[]>([])
  const [othersText, setOthersText] = useState('')

  const isStorageValid =
    storageReasons.length > 0 &&
    (!storageReasons.includes('others') || storageOthersText.trim().length > 0)
  const isOriginValid =
    originSelected.length > 0 &&
    (!originSelected.includes('other') || othersText.trim().length > 0)
  const isValid = isStorageValid && isOriginValid

  const handleToggleReason = (value: string) => {
    setStorageReasons((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    )
  }

  const handleNext = () => {
    // TODO: persist storage mode reasons + origin data via API
    goToLanding()
  }

  return (
    <>
      <ModalHeader color="secondary.500">
        <Container maxW="42.5rem">Before you continue,</Container>
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap">
        <Container maxW="42.5rem">
          <Stack spacing="2.5rem">
            <FormControl isRequired>
              <Text textStyle="subhead-1" color="secondary.700" mb="0.5rem">
                Why are you creating a Storage mode form?
              </Text>
              <Stack spacing="0.25rem">
                {STORAGE_MODE_REASONS.map((reason) => (
                  <Box key={reason.value}>
                    <Checkbox
                      isChecked={storageReasons.includes(reason.value)}
                      onChange={() => handleToggleReason(reason.value)}
                    >
                      {reason.label}
                    </Checkbox>
                    {reason.value === 'others' &&
                      storageReasons.includes('others') && (
                        <Box mt="0.25rem" pl="2.5rem">
                          <Input
                            placeholder="Please specify"
                            value={storageOthersText}
                            onChange={(e) =>
                              setStorageOthersText(e.target.value)
                            }
                            autoFocus
                          />
                        </Box>
                      )}
                  </Box>
                ))}
              </Stack>
            </FormControl>

            <FormControl isRequired>
              <Text textStyle="subhead-1" color="secondary.700" mb="0.5rem">
                Where is this being filled today?
              </Text>
              <OriginSelection
                selected={originSelected}
                onSelectionChange={setOriginSelected}
                othersText={othersText}
                onOthersTextChange={setOthersText}
              />
            </FormControl>

            <Button
              isDisabled={!isValid}
              rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
              onClick={handleNext}
              isFullWidth
            >
              Next step
            </Button>
          </Stack>
        </Container>
      </ModalBody>
    </>
  )
}
