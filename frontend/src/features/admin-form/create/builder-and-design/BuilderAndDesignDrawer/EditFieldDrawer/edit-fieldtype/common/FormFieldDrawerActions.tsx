import { FieldValues, UseFormHandleSubmit } from 'react-hook-form'
import { Stack } from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'

interface FormFieldDrawerActionsProps {
  isLoading: boolean
  isSaveEnabled: boolean
  handleClick: ReturnType<UseFormHandleSubmit<FieldValues>>
  handleCancel: () => void
  buttonText: string
}

export const FormFieldDrawerActions = ({
  isLoading,
  isSaveEnabled,
  handleClick,
  handleCancel,
  buttonText,
}: FormFieldDrawerActionsProps): JSX.Element => {
  const isMobile = useIsMobile()

  return (
    <Stack
      direction={{ base: 'column', md: 'row-reverse' }}
      justifyContent="end"
      w="100%"
      spacing="1rem"
    >
      <Button
        isFullWidth={isMobile}
        isDisabled={isLoading || !isSaveEnabled}
        isLoading={isLoading}
        onClick={handleClick}
      >
        {buttonText}
      </Button>
      <Button
        isDisabled={isLoading}
        isFullWidth={isMobile}
        variant="clear"
        colorScheme="secondary"
        onClick={handleCancel}
      >
        Cancel
      </Button>
    </Stack>
  )
}
