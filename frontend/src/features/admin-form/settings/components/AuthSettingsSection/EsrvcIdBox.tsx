import {
  ChangeEventHandler,
  KeyboardEventHandler,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'
import ReactMarkdown from 'react-markdown'
import {
  Flex,
  FormLabel,
  InputGroup,
  InputRightElement,
  Stack,
  VisuallyHidden,
} from '@chakra-ui/react'

import { FormAuthType, FormSettings } from '~shared/types/form'

import { GUIDE_ENABLE_SPCP } from '~constants/links'
import { useMdComponents } from '~hooks/useMdComponents'
import Input from '~components/Input'
import Spinner from '~components/Spinner'

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

  const mdComponents = useMdComponents({
    styles: {
      text: {
        textStyle: 'body-2',
        color: 'secondary.400',
      },
    },
  })

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

  const renderedHelperText = useMemo(() => {
    switch (settings.authType) {
      case FormAuthType.SP:
        return `Find out [how to get your Singpass e-service ID](${GUIDE_ENABLE_SPCP}).`
      case FormAuthType.CP:
        return `Corppass now uses Singpass to authenticate corporate users. You will still need a separate **Corppass e-service ID**. Find out [how to get your Corppass e-service ID](${GUIDE_ENABLE_SPCP}).`
      default:
        return ''
    }
  }, [settings.authType])

  return (
    <Stack ml="2.75rem" mb="1.25rem">
      <ReactMarkdown components={mdComponents}>
        {renderedHelperText}
      </ReactMarkdown>
      <VisuallyHidden>
        <FormLabel htmlFor="esrvc-id">e-service ID:</FormLabel>
      </VisuallyHidden>
      <Flex maxW="20rem" w="100%">
        <InputGroup>
          <InputRightElement pointerEvents="none">
            <Spinner display={mutateFormEsrvcId.isLoading ? 'flex' : 'none'} />
          </InputRightElement>
          <Input
            isDisabled={isDisabled}
            isReadOnly={mutateFormEsrvcId.isLoading}
            ref={inputRef}
            value={value}
            onChange={handleValueChange}
            onKeyDown={handleKeydown}
            onBlur={handleBlur}
            id="esrvc-id"
            placeholder="Enter Singpass e-service ID"
          />
        </InputGroup>
      </Flex>
    </Stack>
  )
}
