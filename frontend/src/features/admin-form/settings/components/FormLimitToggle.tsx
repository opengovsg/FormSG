import {
  KeyboardEventHandler,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'
import { FormControl, Skeleton } from '@chakra-ui/react'

import FormLabel from '~components/FormControl/FormLabel'
import NumberInput from '~components/NumberInput'
import Toggle from '~components/Toggle'

import { useMutateFormSettings } from '../mutations'
import { useAdminFormSettings } from '../queries'

interface FormLimitBlockProps {
  initialLimit: string
}
const FormLimitBlock = ({ initialLimit }: FormLimitBlockProps): JSX.Element => {
  const [value, setValue] = useState(initialLimit)

  const inputRef = useRef<HTMLInputElement>(null)
  const { mutateFormLimit } = useMutateFormSettings()

  // TODO: Show error when given value is below current submission counts.
  const handleValueChange = useCallback((val: string) => {
    // Only allow numeric inputs
    setValue(val.replace(/\D/g, ''))
  }, [])

  const handleBlur = useCallback(() => {
    if (value === initialLimit) return
    if (value === '') {
      return setValue(initialLimit)
    }

    return mutateFormLimit.mutate(parseInt(value, 10))
  }, [initialLimit, mutateFormLimit, value])

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
    <FormControl mt="2rem">
      <FormLabel
        isRequired
        description="Your form will automatically close once it reaches the set limit. Enable
        reCaptcha to prevent spam submissions from triggering this limit."
      >
        Maximum number of responses allowed
      </FormLabel>
      <NumberInput
        maxW="16rem"
        ref={inputRef}
        min={0}
        inputMode="numeric"
        allowMouseWheel
        precision={0}
        value={value}
        onChange={handleValueChange}
        onKeyDown={handleKeydown}
        onBlur={handleBlur}
      />
    </FormControl>
  )
}

export const FormLimitToggle = (): JSX.Element => {
  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  const isLimit = useMemo(
    () => settings && settings?.submissionLimit !== null,
    [settings],
  )

  const { mutateFormLimit } = useMutateFormSettings()

  const handleToggleLimit = useCallback(() => {
    if (!settings || isLoadingSettings || mutateFormLimit.isLoading) return
    const nextLimit = settings.submissionLimit === null ? 1000 : null
    return mutateFormLimit.mutate(nextLimit)
  }, [isLoadingSettings, mutateFormLimit, settings])

  return (
    <Skeleton isLoaded={!isLoadingSettings && !!settings}>
      <Toggle
        isLoading={mutateFormLimit.isLoading}
        isChecked={isLimit}
        label="Set a response limit"
        onChange={() => handleToggleLimit()}
      />
      {settings && settings?.submissionLimit !== null && (
        <FormLimitBlock initialLimit={String(settings.submissionLimit)} />
      )}
    </Skeleton>
  )
}
