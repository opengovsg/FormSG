import { BiRightArrowAlt } from 'react-icons/bi'
import { Container, ModalBody, ModalHeader, Text } from '@chakra-ui/react'

import Badge from '~components/Badge'
import Button from '~components/Button'

import { useMagicFormBuilderWizard } from '../MagicFormBuilderWizardContext'

export const MagicFormBuilderPdfDetailsScreen = (): JSX.Element => {
  const { handleDetailsSubmit, isLoading, isFetching } =
    useMagicFormBuilderWizard()

  return (
    <>
      <ModalHeader color="secondary.700">
        <Container maxW={'42.5rem'} p={0}>
          Build your form using PDF
          <Badge bgColor="primary.100" ml="1rem">
            Beta
          </Badge>
        </Container>
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap">
        <Container maxW={'42.5rem'} p={0}>
          <Button
            rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
            type="submit"
            isLoading={isLoading}
            isDisabled={isFetching}
            onClick={handleDetailsSubmit}
            isFullWidth
          >
            <Text lineHeight="1.5rem">Next step</Text>
          </Button>
        </Container>
      </ModalBody>
    </>
  )
}
