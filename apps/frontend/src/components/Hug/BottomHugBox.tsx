import { Flex } from '@chakra-ui/react'

const BottomHugBox = ({ children }: { children: JSX.Element }) => {
  return (
    <Flex
      position="fixed"
      bottom="1.5rem"
      left="50%"
      transform="translateX(-50%)"
      zIndex="2"
    >
      <Flex
        px="1.5rem"
        py="1rem"
        bgColor="white"
        boxShadow="md"
        borderRadius="0.25rem"
        width="fit-content"
      >
        {children}
      </Flex>
    </Flex>
  )
}

export default BottomHugBox
