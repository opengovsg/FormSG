import { Dispatch, SetStateAction, useState } from 'react'
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

import formPluginDataStore from '~contexts/PluginsSingleton'
import { useToast } from '~hooks/useToast'

import Button from '../components/Button'

const HARDCODED_MOE_DATA = [
  {
    class: '1A',
    school: 'Red Rose Primary School',
    level: 'Primary 4',
    students: [
      { register_no: '111', identifier: 'S1234567D', name: 'ah boy' },
      { register_no: '112', identifier: 'S1234568B', name: 'another boy' },
    ],
  },
  {
    class: '1B',
    school: 'Red Rose Primary School',
    level: 'Primary 4',
    students: [
      { register_no: '113', identifier: 'S1234432E', name: 'ah girl' },
      { register_no: '114', identifier: 'S1234499F', name: 'another girl' },
    ],
  },
]

export const MOEAuthComponent = ({
  setIsPluginConnected,
}: {
  setIsPluginConnected: Dispatch<SetStateAction<boolean>>
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  const [isLoading, setIsLoading] = useState(false)

  const toast = useToast()

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
                isLoading={isLoading}
                onClick={() => {
                  // wait for 1 seconds
                  setIsLoading(true)
                  formPluginDataStore.addPlugin({
                    name: 'MOEResultsComponent',
                    data: HARDCODED_MOE_DATA,
                  })
                  setTimeout(() => {
                    setIsPluginConnected(true)
                    setIsLoading(false)
                    toast({
                      title: 'Successfully logged in!',
                      description: 'You are now logged in to MOE systems',
                      status: 'success',
                      duration: 3000,
                      isClosable: true,
                    })
                    onClose()
                  }, 1000)
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
