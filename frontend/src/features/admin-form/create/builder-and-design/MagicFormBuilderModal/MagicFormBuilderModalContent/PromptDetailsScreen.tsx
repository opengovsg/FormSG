import { BiRightArrowAlt } from 'react-icons/bi'
import { Container, Flex, ModalBody, ModalHeader, Text } from '@chakra-ui/react'

import Badge from '~components/Badge'
import Button from '~components/Button'

import { useMagicFormBuilderWizard } from '../MagicFormBuilderWizardContext'

export const MagicFormBuilderPromptDetailsScreen = (): JSX.Element => {
  const { handleDetailsSubmit, isLoading, isFetching, handleBack } =
    useMagicFormBuilderWizard()

  return (
    <>
      <ModalHeader color="secondary.700">
        <Container maxW={'42.5rem'} p={0}>
          Build your form using AI
          <Badge bgColor="primary.100" ml="1rem">
            Beta
          </Badge>
        </Container>
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap">
        <Container maxW={'42.5rem'} p={0}>
          <Flex justify="flex-end" gap="1rem">
            <Button
              mr="1rem"
              type="submit"
              isLoading={isLoading}
              isDisabled={isFetching}
              onClick={handleBack}
              variant="clear"
            >
              <Text lineHeight="1.5rem">Back</Text>
            </Button>
            <Button
              rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
              type="submit"
              isLoading={isLoading}
              isDisabled={isFetching}
              onClick={handleDetailsSubmit}
            >
              <Text lineHeight="1.5rem">Next step</Text>
            </Button>
          </Flex>
        </Container>
      </ModalBody>
    </>
  )
}
