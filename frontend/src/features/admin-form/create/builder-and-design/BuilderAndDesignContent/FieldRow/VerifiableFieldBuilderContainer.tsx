import { Box, Stack } from '@chakra-ui/react'

import { FormColorTheme, FormFieldWithId } from '~shared/types'

import Button from '~components/Button'
import { FieldContainer } from '~templates/Field/FieldContainer'

import { VerifiableFieldBase } from '~features/verifiable-fields/types'

type VerifiableFieldBuilderContainerProps = {
  schema: FormFieldWithId<VerifiableFieldBase>
  colorTheme?: FormColorTheme
  children: React.ReactNode
}

export const VerifiableFieldBuilderContainer = ({
  schema,
  colorTheme = FormColorTheme.Blue,
  children,
}: VerifiableFieldBuilderContainerProps): JSX.Element => {
  return (
    <FieldContainer schema={schema}>
      <Stack spacing="0.5rem" direction={{ base: 'column', md: 'row' }}>
        {children}
        <Box>
          <Button isDisabled colorScheme={`theme-${colorTheme}`}>
            Verify
          </Button>
        </Box>
      </Stack>
    </FieldContainer>
  )
}
