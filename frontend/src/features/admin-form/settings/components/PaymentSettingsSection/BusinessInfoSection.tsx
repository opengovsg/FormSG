import {
  ChangeEventHandler,
  KeyboardEventHandler,
  useCallback,
  useRef,
  useState,
} from 'react'
import { FormControl } from '@chakra-ui/react'

import { FormResponseMode, StorageFormSettings } from '~shared/types'

import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

import { useMutateFormSettings } from '../../mutations'
import { useAdminFormSettings } from '../../queries'

interface BusinessFieldInputProps {
  initialValue: string
  handleMutation: (newAddress: string) => void
}
const BusinessFieldInput = ({
  initialValue,
  handleMutation,
}: BusinessFieldInputProps): JSX.Element => {
  const [value, setValue] = useState(initialValue)

  const inputRef = useRef<HTMLInputElement>(null)

  const handleValueChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      setValue(e.target.value)
    },
    [],
  )

  const handleBlur = useCallback(() => {
    if (value === initialValue) return
    const trimmedValue = value.trim()
    handleMutation(trimmedValue)
    setValue(trimmedValue)
  }, [handleMutation, value, initialValue])

  const handleKeydown: KeyboardEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        inputRef.current?.blur()
      }
    },
    [],
  )

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={handleValueChange}
      onKeyDown={handleKeydown}
      onBlur={handleBlur}
      placeholder={'Using Agency Defaults'}
    />
  )
}

const BusinessInfoBlock = ({ settings }: { settings: StorageFormSettings }) => {
  const { mutateFormBusiness } = useMutateFormSettings()
  const handleAddressMutation = (newAddress: string) => {
    mutateFormBusiness.mutate({ address: newAddress })
  }
  const handleGstRegNoMutation = (newGstRegNo: string) => {
    mutateFormBusiness.mutate({ gstRegNo: newGstRegNo })
  }
  return (
    <>
      <FormControl mb="2.5rem" isReadOnly={mutateFormBusiness.isLoading}>
        <FormLabel description="Leave empty to use your agency defaults.">
          GST Registration Number
        </FormLabel>
        <BusinessFieldInput
          initialValue={settings.business?.gstRegNo || ''}
          handleMutation={handleGstRegNoMutation}
        />
      </FormControl>
      <FormControl mb="2.5rem" isReadOnly={mutateFormBusiness.isLoading}>
        <FormLabel description="Leave empty to use your agency defaults.">
          Business Address
        </FormLabel>
        <BusinessFieldInput
          initialValue={settings.business?.address || ''}
          handleMutation={handleAddressMutation}
        />
      </FormControl>
    </>
  )
}

export const BusinessInfoSection = () => {
  const { data: settings, isLoading } = useAdminFormSettings()

  if (
    isLoading ||
    !settings ||
    settings.responseMode !== FormResponseMode.Encrypt
  ) {
    return <></>
  }

  return <BusinessInfoBlock settings={settings} />
}
