import { useFormContext } from 'react-hook-form'
import { Box, Input, Stack } from '@chakra-ui/react'

import Button from '~components/Button'
import FormLabel from '~components/FormControl/FormLabel'

import { FieldContainer } from '../FieldContainer'
import { AddressFieldSchema } from '../types'

import { AddressFieldContainer } from './AddressFieldContainer'

export const AddressField = ({
  schema,
}: {
  schema: AddressFieldSchema
}): JSX.Element => {
  return <AddressFieldContainer schema={schema}></AddressFieldContainer>
}
