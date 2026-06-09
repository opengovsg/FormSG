import { useState } from 'react'
import { BiRightArrowAlt } from 'react-icons/bi'
import {
  Container,
  ModalBody,
  ModalHeader,
  Stack,
  Text,
} from '@chakra-ui/react'

import Button from '~components/Button'

import {
  FormOriginValue,
  OriginSelection,
} from '../../CreateFormFlowV2/OriginSelection'
import { useCreateFormWizard } from '../../CreateFormModal/CreateFormWizardContext'

export const CreateFormOriginScreen = (): JSX.Element => {
  const { goToLanding } = useCreateFormWizard()

  const [selected, setSelected] = useState<FormOriginValue[]>([])
  const [othersText, setOthersText] = useState('')

  const isValid =
    selected.length > 0 &&
    (!selected.includes('other') || othersText.trim().length > 0)

  const handleNext = () => {
    // TODO: persist origin data to form metadata via API
    goToLanding()
  }

  return (
    <>
      <ModalHeader color="secondary.500">
        <Container maxW="42.5rem">Where is this being filled today?</Container>
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap">
        <Container maxW="42.5rem">
          <Stack spacing="1.5rem">
            <OriginSelection
              selected={selected}
              onSelectionChange={setSelected}
              othersText={othersText}
              onOthersTextChange={setOthersText}
            />

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
