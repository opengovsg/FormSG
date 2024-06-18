import { Controller } from 'react-hook-form'
import { BiRightArrowAlt } from 'react-icons/bi'
import {
  Container,
  Flex,
  FormControl,
  ModalBody,
  ModalHeader,
  Skeleton,
  Text,
} from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import Badge from '~components/Badge'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'

import { useMagicFormBuilderWizard } from '../MagicFormBuilderWizardContext'

import { MagicFormBuilderOptions } from './MagicFormBuilderOptions'

export const MagicFormBuilderLandingScreen = ({
  onClose,
}: {
  onClose: () => void
}): JSX.Element => {
  const {
    formMethods,
    handleDetailsSubmit,
    isLoading,
    isFetching,
    modalHeader,
  } = useMagicFormBuilderWizard()
  const {
    control,
    formState: { errors },
  } = formMethods

  const isMobile = useIsMobile()
  return (
    <>
      <ModalHeader color="secondary.700">
        <Container maxW={'42.5rem'} p={0}>
          {modalHeader}
          <Badge bgColor="primary.100" ml="1rem">
            Beta
          </Badge>
        </Container>
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap">
        <Container maxW={'42.5rem'} p={0}>
          <FormControl
            isRequired
            isInvalid={!!errors.magicFormBuilderMode}
            mb="1.125rem"
          >
            <Skeleton isLoaded={!isFetching}>
              <Controller
                name="magicFormBuilderMode"
                control={control}
                render={({ field }) => <MagicFormBuilderOptions {...field} />}
                rules={{ required: 'Please select a magic form builder mode' }}
              />
            </Skeleton>
            <FormErrorMessage>
              {errors.magicFormBuilderMode?.message}
            </FormErrorMessage>
          </FormControl>

          <Text
            textStyle="body-2"
            fontSize="0.625rem"
            lineHeight="0.75rem"
            textColor="secondary.400"
            mb="2.5rem"
          >
            Disclaimer: This makes use of an AI language model. Any content it
            generates may contain errors, inconsistencies, or outdated
            information, and does not represent official government views.
            Please fact-check and verify all AI-generated content before use.
          </Text>

          {isMobile ? (
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
          ) : (
            <Flex justify="flex-end" gap="1rem">
              <Button
                mr="1rem"
                type="submit"
                isLoading={isLoading}
                isDisabled={isFetching}
                onClick={onClose}
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
          )}
        </Container>
      </ModalBody>
    </>
  )
}
