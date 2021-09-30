import { useMemo, useState } from 'react'
import { BiCheck } from 'react-icons/bi'
import {
  Flex,
  FormControl,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
} from '@chakra-ui/react'

import Button from '~components/Button'
import FormLabel from '~components/FormControl/FormLabel'
import PhoneNumberInput from '~components/PhoneNumberInput'

import { useUserMutations } from '~features/user/mutations'
import { useUser } from '~features/user/queries'

import { VerificationBox } from './VerificationBox'

const ContactNumberInput = () => {
  const { user, isLoading } = useUser()
  const [isVfnOpen, setIsVfnOpen] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [contact, setContact] = useState(user?.contact)

  const isVerified = useMemo(
    () => !!user?.contact && contact === user.contact,
    [contact, user?.contact],
  )

  const { generateOtpMutation } = useUserMutations()

  const handleVerifyMobile = () => {
    if (!user || !contact) return
    return generateOtpMutation.mutate(
      { userId: user._id, contact },
      { onSuccess: () => setIsVfnOpen(true) },
    )
  }

  const handleInputChange = (nextVal?: string) => {
    if (isVfnOpen && nextVal !== contact) {
      setIsVfnOpen(false)
    }
    setContact(nextVal)
  }

  return (
    <FormControl isReadOnly={isLoading} mb="1.5rem" mt="2rem">
      <FormLabel isRequired>Mobile number</FormLabel>
      <Flex>
        <PhoneNumberInput
          isSuccess={isSuccess}
          value={contact}
          onChange={handleInputChange}
        />
        <Button
          isDisabled={isVerified}
          ml="0.5rem"
          onClick={handleVerifyMobile}
          isLoading={generateOtpMutation.isLoading}
          leftIcon={isVerified ? <BiCheck fontSize="1.5rem" /> : undefined}
        >
          {isVerified ? 'Verified' : 'Verify'}
        </Button>
      </Flex>
      {isVfnOpen && !isVerified ? (
        <VerificationBox onSuccess={() => setIsSuccess(true)} />
      ) : null}
    </FormControl>
  )
}

export const EmergencyContactModal = (): JSX.Element => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  return (
    <>
      <Button onClick={onOpen}>Open</Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader color="secondary.700">Emergency contact</ModalHeader>
          <ModalBody whiteSpace="pre-line">
            <Text textStyle="body-2" color="secondary.500">
              Update your mobile number and verify it so we can contact you in
              the unlikely case of an urgent form issue. This number can be
              changed at any time in your user settings.
            </Text>
            <ContactNumberInput />
          </ModalBody>
          <ModalFooter></ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
