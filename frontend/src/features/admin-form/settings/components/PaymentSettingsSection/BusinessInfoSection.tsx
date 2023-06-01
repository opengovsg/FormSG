import {
  ChangeEventHandler,
  KeyboardEventHandler,
  useCallback,
  useRef,
  useState,
} from 'react'
import { FormControl } from '@chakra-ui/react'

import {
  AgencyBase,
  FormResponseMode,
  StorageFormSettings,
} from '~shared/types'

import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useMutateFormSettings } from '../../mutations'
import { useAdminFormSettings } from '../../queries'

interface BusinessFieldInputProps {
  initialValue: string
  handleMutation: (newAddress: string) => void
  placeholder: string
}
const BusinessFieldInput = ({
  initialValue,
  handleMutation,
  placeholder,
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
      placeholder={placeholder}
      _placeholder={{ opacity: 1 }}
    />
  )
}

const BusinessInfoBlock = ({
  settings,
  agencyDefaults,
}: {
  settings: StorageFormSettings
  agencyDefaults: AgencyBase['business']
}) => {
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
        <FormLabel
          description="Leave blank to use your agency's GST Registration Number"
          isRequired
        >
          GST Registration Number
        </FormLabel>
        <BusinessFieldInput
          placeholder={agencyDefaults?.gstRegNo || ''}
          initialValue={settings.business?.gstRegNo || ''}
          handleMutation={handleGstRegNoMutation}
        />
      </FormControl>
      <FormControl mb="2.5rem" isReadOnly={mutateFormBusiness.isLoading}>
        <FormLabel
          description="Leave blank to use your agency's business address"
          isRequired
        >
          Business Address
        </FormLabel>
        <BusinessFieldInput
          placeholder={agencyDefaults?.address || ''}
          initialValue={settings.business?.address || ''}
          handleMutation={handleAddressMutation}
        />
      </FormControl>
    </>
  )
}

export const BusinessInfoSection = () => {
  const { data: settings, isLoading } = useAdminFormSettings()
  const { data: adminSettings } = useAdminForm()

  if (
    isLoading ||
    !settings ||
    settings.responseMode !== FormResponseMode.Encrypt ||
    !adminSettings
  ) {
    return <></>
  }

  return (
    <BusinessInfoBlock
      settings={settings}
      agencyDefaults={adminSettings.admin.agency.business}
    />
  )
}
