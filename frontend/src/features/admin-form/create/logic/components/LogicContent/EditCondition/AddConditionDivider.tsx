import { BiPlus } from 'react-icons/bi'
import { Divider, Flex } from '@chakra-ui/react'

import Button from '~components/Button'

export interface AddConditionDividerProps {
  handleAddCondition: () => void
  isDisabled: boolean
}

export const AddConditionDivider = ({
  handleAddCondition,
  isDisabled,
}: AddConditionDividerProps): JSX.Element => {
  return (
    <Flex flexDir="row" align="center" my="0.5rem">
      <Divider display={{ base: 'none', md: 'block' }} w="2rem" />
      <Button
        isDisabled={isDisabled}
        leftIcon={<BiPlus fontSize="1.5rem" />}
        onClick={handleAddCondition}
      >
        Add condition
      </Button>
      <Divider flex={1} />
    </Flex>
  )
}
