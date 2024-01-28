import { BiBulb, BiRightArrowAlt } from 'react-icons/bi'
import {
  Container,
  Flex,
  FormControl,
  FormLabel,
  Icon,
  ModalBody,
  ModalHeader,
  Text,
} from '@chakra-ui/react'

import Badge from '~components/Badge'
import Button from '~components/Button'
import Textarea from '~components/Textarea'

import { useMagicFormBuilderWizard } from '../MagicFormBuilderWizardContext'

export const MagicFormBuilderPromptDetailsScreen = (): JSX.Element => {
  const {
    handleDetailsSubmit,
    formMethods,
    isLoading,
    isFetching,
    handleBack,
  } = useMagicFormBuilderWizard()

  const {
    register,
    formState: { errors },
  } = formMethods

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
          <FormLabel>I want to create a form that collects...</FormLabel>
          <FormControl isRequired isInvalid={!!errors.prompt}>
            <Textarea
              {...register('prompt')}
              placeholder="personal particulars for an event"
              borderBottomRadius="0"
            />
          </FormControl>
          <Flex
            flexDir="column"
            border="1px"
            borderColor="neutral.400"
            mt="-.25rem"
            px="1rem"
            py="1.5rem"
            gap="2rem"
          >
            <Text textStyle="subhead-1">Ideas for you</Text>
            <Flex alignItems="start">
              <Icon
                as={BiBulb}
                color="secondary.500"
                mr="1rem"
                boxSize="1.5rem"
              />
              Employee feedback on workplace environment and culture.
            </Flex>
            <Flex alignItems="start">
              <Icon
                as={BiBulb}
                color="secondary.500"
                mr="1rem"
                boxSize="1.5rem"
              />
              Event registrations and dietary preferences for dance and dinner.
            </Flex>
            <Flex alignItems="start">
              <Icon
                as={BiBulb}
                color="secondary.500"
                mr="1rem"
                boxSize="1.5rem"
              />
              Support requests for building faults and damages.
            </Flex>
          </Flex>
          <Flex justify="flex-end" gap="1rem" mt="2.25rem">
            <Button
              mr="1rem"
              type="submit"
              isDisabled={isLoading || isFetching}
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
