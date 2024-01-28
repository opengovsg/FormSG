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
import FormLabel from '~components/FormControl/FormLabel'

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
            mb="2.5rem"
          >
            <FormLabel>How do you want to build?</FormLabel>
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
