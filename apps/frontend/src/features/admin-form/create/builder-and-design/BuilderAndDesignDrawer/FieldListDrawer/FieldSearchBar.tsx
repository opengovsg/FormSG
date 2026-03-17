import { BiSearch } from 'react-icons/bi'
import { Icon, Input, InputGroup, InputLeftElement } from '@chakra-ui/react'

export const FieldSearchBar = ({
  searchValue,
  onChange,
}: {
  searchValue: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) => (
  <InputGroup>
    <InputLeftElement>
      <Icon as={BiSearch} color="secondary.500" fontSize="1.25rem" />
    </InputLeftElement>
    <Input
      value={searchValue}
      onChange={onChange}
      placeholder="Search fields"
    />
  </InputGroup>
)
