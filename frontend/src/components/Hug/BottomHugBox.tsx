import { Flex } from '@chakra-ui/react'

const BottomHugBox = ({ children }: { children: JSX.Element }) => {
  return (
    <Flex
      position="fixed"
      bottom="1.5rem"
      justifyContent="center"
      margin="auto"
      width="100%"
      zIndex="2"
    >
      <Flex
        px="1.5rem"
        py="1rem"
        bgColor="white"
        boxShadow="md"
        borderRadius="0.25rem"
      >
        {children}
      </Flex>
    </Flex>
  )
}

export default BottomHugBox
