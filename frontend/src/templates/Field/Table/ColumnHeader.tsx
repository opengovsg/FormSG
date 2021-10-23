import { Text } from '@chakra-ui/layout'

import FormLabel from '~components/FormControl/FormLabel'

interface ColumnHeaderProps {
  title: string
  isRequired: boolean
  id: string
}

export const ColumnHeader = ({
  title,
  isRequired,
  id,
}: ColumnHeaderProps): JSX.Element => {
  return (
    <>
      <Text as="label" id={id}>
        {title}
      </Text>
      <FormLabel.OptionalIndicator isRequired={isRequired} />
    </>
  )
}
