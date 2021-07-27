import {
  ChangeEvent,
  cloneElement,
  isValidElement,
  ReactNode,
  useRef,
} from 'react'
import {
  Box,
  Checkbox as ChakraCheckbox,
  CheckboxProps,
  ComponentWithAs,
  Flex,
  forwardRef,
  useMergeRefs,
  useMultiStyleConfig,
} from '@chakra-ui/react'

type CheckboxComponent = ComponentWithAs<'input', CheckboxProps> & {
  Others: typeof CheckboxOthers
}

export const Checkbox = ChakraCheckbox as CheckboxComponent
interface CheckboxOthersProps extends CheckboxProps {
  label?: ReactNode
}

const CheckboxOthers = forwardRef<CheckboxOthersProps, 'input'>(
  ({ children, label, ...props }, ref) => {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const mergedRef = useMergeRefs(ref, inputRef)
    const handleInputChange = () => {
      if (!inputRef?.current?.checked) {
        inputRef?.current?.click()
      }
    }
    return (
      <Box>
        <Checkbox {...props} ref={mergedRef}>
          {label}
        </Checkbox>
        <OthersWrapper onInputChange={handleInputChange}>
          {children}
        </OthersWrapper>
      </Box>
    )
  },
)

const OthersWrapper = ({
  children,
  onInputChange,
  onClick,
}: {
  children: ReactNode
  onInputChange: () => void
  onClick?: (e: ChangeEvent<HTMLInputElement>) => void
}) => {
  const style = useMultiStyleConfig('Checkbox', {})
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    onInputChange()
    onClick?.(e)
  }
  return (
    <Flex __css={style.others}>
      {isValidElement(children) &&
        cloneElement(children, {
          onClick: handleInputChange,
        })}
    </Flex>
  )
}

Checkbox.Others = CheckboxOthers
