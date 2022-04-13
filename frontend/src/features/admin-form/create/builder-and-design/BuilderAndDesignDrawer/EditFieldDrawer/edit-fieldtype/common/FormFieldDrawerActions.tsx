import { FieldValues, UseFormHandleSubmit } from 'react-hook-form'
import { ButtonGroup } from '@chakra-ui/button'

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
  return (
    <ButtonGroup
      justifyContent="end"
      w="100%"
      isDisabled={isLoading}
      spacing="1rem"
    >
      <Button variant="clear" colorScheme="secondary" onClick={handleCancel}>
        Cancel
      </Button>
      <Button
        isDisabled={!isSaveEnabled}
        isLoading={isLoading}
        onClick={handleClick}
      >
        {buttonText}
      </Button>
    </ButtonGroup>
  )
}
