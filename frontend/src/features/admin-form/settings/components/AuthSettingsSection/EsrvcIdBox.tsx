import {
  ChangeEventHandler,
  KeyboardEventHandler,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  FormLabel,
  Input,
  Link,
  Stack,
  Text,
  VisuallyHidden,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'

import { FormSettings } from '~shared/types/form'

import { useMutateFormSettings } from '../../mutations'

interface EsrvcIdBoxProps {
  settings: FormSettings
  isDisabled: boolean
}

export const EsrvcIdBox = ({
  settings,
  isDisabled,
}: EsrvcIdBoxProps): JSX.Element => {
  const initialEsrvcId = useMemo(() => settings.esrvcId ?? '', [settings])

  const [value, setValue] = useState<string>(initialEsrvcId)

  const inputRef = useRef<HTMLInputElement>(null)
  const { mutateFormEsrvcId } = useMutateFormSettings()

  const handleValueChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => setValue(e.target.value),
    [],
  )

  const handleBlur = useCallback(() => {
    if (value === initialEsrvcId) return

    return mutateFormEsrvcId.mutate(value, {
      onError: () => {
        setValue(initialEsrvcId)
      },
    })
  }, [initialEsrvcId, mutateFormEsrvcId, value])

  const handleKeydown: KeyboardEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        inputRef.current?.blur()
      }
    },
    [],
  )

  return (
    <Stack ml="2.75rem" mb="1.25rem">
      <Text textStyle="body-2" color="secondary.400">
        Find out{' '}
        <Link
          isExternal
          href="https://guide.form.gov.sg/AdvancedGuide.html#how-do-you-enable-singpass-or-corppass"
        >
          how to get your Singpass e-service ID
        </Link>
        .
      </Text>
      <VisuallyHidden>
        <FormLabel htmlFor="esrvc-id">e-service ID:</FormLabel>
      </VisuallyHidden>
      <Wrap spacing="1rem">
        <WrapItem maxW="20rem" w="100%">
          <Input
            isDisabled={isDisabled}
            ref={inputRef}
            value={value}
            onChange={handleValueChange}
            onKeyDown={handleKeydown}
            onBlur={handleBlur}
            id="esrvc-id"
            placeholder="Enter Singpass e-service ID"
          />
        </WrapItem>
      </Wrap>
    </Stack>
  )
}
