import { useState } from 'react'
import { BiBulb, BiRightArrowAlt } from 'react-icons/bi'
import {
  Box,
  Container,
  Flex,
  FormControl,
  FormErrorIcon,
  FormErrorMessage,
  FormLabel,
  ModalBody,
  ModalHeader,
  Text,
} from '@chakra-ui/react'

import { PROMPT_CHAR_LIMIT, promptIdeas } from '~shared/constants'

import { BxsErrorCircle } from '~assets/icons'
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
    setValue,
    formState: { errors },
  } = formMethods

  const handleUseIdea = (idea: string) => () => setValue('prompt', idea)
  const [inputValue, setInputValue] = useState('')

  return (
    <>
      <ModalHeader color="secondary.700">
        <Container maxW={'42.5rem'} p={0}>
          Write a prompt
        </Container>
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap">
        <Container maxW={'42.5rem'} p={0}>
          <FormLabel>I want to create a form that collects...</FormLabel>
          <FormControl isRequired isInvalid={!!errors.prompt}>
            <Textarea
              {...register('prompt', {
                required: 'Please enter a prompt.',
                onChange: (e) => setInputValue(e.target.value),
                maxLength: {
                  value: 300,
                  message: 'Please enter at most 300 characters.',
                },
              })}
              placeholder="personal particulars for an event"
            />
            <FormErrorMessage>
              <FormErrorIcon h="1.5rem" as={BxsErrorCircle} />
              {errors.prompt?.message} {inputValue.length}/{PROMPT_CHAR_LIMIT}
            </FormErrorMessage>
          </FormControl>
          <Box mt="1rem">
            <Flex
              flexDir="column"
              border="1px"
              borderColor="neutral.400"
              bg="white"
              mt="-.25rem"
              py="0.75rem"
              borderRadius="0.25rem"
            >
              <Flex my="0.5rem" px="1rem">
                {<BiBulb fontSize="1.6rem" />}
                <Text textStyle="subhead-1" px="1rem">
                  Try one of these
                </Text>
              </Flex>
              {promptIdeas.map((idea: string) => (
                <Button
                  variant="clear"
                  color="secondary.500"
                  justifyContent="flex-start"
                  padding="0"
                  onClick={handleUseIdea(idea)}
                >
                  <Text
                    textStyle="subhead-1"
                    color="secondary.500"
                    fontWeight="400"
                    px="1rem"
                    textAlign="justify"
                  >
                    {idea}
                  </Text>
                </Button>
              ))}
            </Flex>
            <Flex justify="flex-end" gap="1rem" mt="2.25rem">
              <Button
                mr="0.5rem"
                type="submit"
                isDisabled={isLoading || isFetching}
                onClick={handleBack}
                variant="clear"
              >
                <Text lineHeight="1.5rem" color="secondary.500">
                  Back
                </Text>
              </Button>
              <Button
                rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
                type="submit"
                isLoading={isLoading}
                isDisabled={isFetching}
                onClick={handleDetailsSubmit}
              >
                <Text lineHeight="1.5rem">Create form</Text>
              </Button>
            </Flex>
          </Box>
        </Container>
      </ModalBody>
    </>
  )
}
