import { FieldValues, UseFormHandleSubmit } from 'react-hook-form'
import { Stack } from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'

interface FormFieldDrawerActionsProps {
  isLoading: boolean
  handleClick: ReturnType<UseFormHandleSubmit<FieldValues>>
  handleCancel: () => void
  buttonText: string
}

export const FormFieldDrawerActions = ({
  isLoading,
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
      spacing={{ base: '0.5rem', md: '1rem' }}
    >
      <Button
        isFullWidth={isMobile}
        isDisabled={isLoading}
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
