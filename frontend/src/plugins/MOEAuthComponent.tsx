import { Dispatch, SetStateAction } from 'react'
import { BiData, BiRightArrow, BiRightArrowAlt } from 'react-icons/bi'
import {
  Box,
  Flex,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react'

import Button from '../components/Button'

export const MOEAuthComponent = ({
  setIsPluginConnected,
}: {
  setIsPluginConnected: Dispatch<SetStateAction<boolean>>
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <>
      <Box bgColor="primary.100" mb="2rem">
        <Flex
          justifyContent={'space-between'}
          alignItems={'center'}
          justifyItems={'center'}
          // vertical align everything
          p="0.75rem"
        >
          <Flex justifyContent={'flex-start'}>
            <Icon as={BiData} color={'primary.500'} mr="0.25rem" mt="0.25rem" />
            <Text>
              View responses with your agency database by connecting to it
            </Text>
          </Flex>
          <Button
            variant="clear"
            onClick={onOpen}
            rightIcon={<BiRightArrowAlt />}
          >
            Connect{' '}
          </Button>
        </Flex>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Log into MOE</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex flexDir={'column'} gap="0.5rem">
              <Button
                colorScheme="primary"
                onClick={() => {
                  setIsPluginConnected(true)
                  onClose()
                }}
                mt="1rem"
              >
                Log in!
              </Button>
            </Flex>
          </ModalBody>

          <ModalFooter></ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
