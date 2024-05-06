import { Box, ListIcon } from '@chakra-ui/react'

interface OrderedListIconProps {
  index: number
}

export const OrderedListIcon = ({ index }: OrderedListIconProps) => {
  return <ListIcon as={OrderedListIconBox} index={index} />
}

const OrderedListIconBox = ({ index }: OrderedListIconProps) => {
  return (
    <Box
      ml="-2.5rem"
      mr="1rem"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      flex="center"
      w="1.5rem"
      h="1.5rem"
      textStyle="subhead-3"
      bg="brand.primary.500"
      color="white"
      borderRadius="4px"
    >
      {index}
    </Box>
  )
}
