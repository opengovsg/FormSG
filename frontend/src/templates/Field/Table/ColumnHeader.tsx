import { Text } from '@chakra-ui/layout'

import FormLabel from '~components/FormControl/FormLabel'

interface ColumnHeaderProps {
  title: string
  isRequired: boolean
}

export const ColumnHeader = ({
  title,
  isRequired,
}: ColumnHeaderProps): JSX.Element => {
  return (
    <>
      <Text as="span">{title}</Text>
      <FormLabel.OptionalIndicator
        textStyle="caption-2"
        isRequired={isRequired}
      />
    </>
  )
}
