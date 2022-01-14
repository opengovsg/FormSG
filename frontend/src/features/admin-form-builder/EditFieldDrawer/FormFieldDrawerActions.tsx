import { FieldValues, UseFormHandleSubmit } from 'react-hook-form'
import { ButtonGroup } from '@chakra-ui/button'

import Button from '~components/Button'

interface FormFieldDrawerActionsProps {
  isLoading: boolean
  isDirty: boolean
  handleClick: ReturnType<UseFormHandleSubmit<FieldValues>>
  handleCancel: () => void
  buttonText: string
}

export const FormFieldDrawerActions = ({
  isLoading,
  isDirty,
  handleClick,
  handleCancel,
  buttonText,
}: FormFieldDrawerActionsProps): JSX.Element => {
  return (
    <ButtonGroup
      justifyContent="end"
      isDisabled={isLoading}
      pos="sticky"
      bottom={0}
    >
      <Button variant="outline" onClick={handleCancel}>
        Cancel
      </Button>
      <Button
        minW="8rem"
        isDisabled={!isDirty}
        isLoading={isLoading}
        onClick={handleClick}
      >
        {buttonText}
      </Button>
    </ButtonGroup>
  )
}
