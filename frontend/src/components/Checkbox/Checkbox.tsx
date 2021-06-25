import {
  cloneElement,
  createContext,
  createRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  Checkbox as ChakraCheckbox,
  CheckboxProps,
  Flex,
  forwardRef,
  Input,
  Text,
  useCheckboxGroup,
  useMergeRefs,
  VStack,
} from '@chakra-ui/react'

const CheckboxContext = createContext<undefined | any>(undefined)

const useCheckboxState = () => {
  const value = useContext(CheckboxContext)

  if (!value) {
    throw new Error('useCheckboxState must be used within a checkbox')
  }
  return value
}

export const Checkbox = forwardRef<CheckboxProps, 'input'>(
  ({ children, ...props }, ref) => {
    // useCheckbox
    // expose useCheckbox props using context
    // pass into chakracheckbox so it's identical

    // ref is used for react forms to determine the current state of the input
    const outsideRef = useRef<HTMLInputElement>()

    // Merge forwarded ref with own ref so that we can access chakra checkbox's internal state
    const mergedRef = useMergeRefs(ref, outsideRef)

    const [isChecked, setIsChecked] = useState(false)

    const handleClick = () => {
      if (!isChecked) {
        setIsChecked(true)
      }
    }

    const select = () => {
      setIsChecked((isPreviouslyChecked) => !isPreviouslyChecked)
    }

    return (
      // give children access to checkbox props and state then let them toggle it
      <CheckboxContext.Provider value={{ ...props, outsideRef }}>
        <VStack align="left">
          {/* <Text>{text}</Text> */}
          <ChakraCheckbox
            isChecked={isChecked}
            onChange={select}
            {...props}
            ref={mergedRef}
          >
            {props.value}
          </ChakraCheckbox>
          {children}
        </VStack>
      </CheckboxContext.Provider>
    )
  },
)

export const Others = ({
  children,
}: {
  children: React.ReactNode
}): JSX.Element => {
  const { outsideRef } = useCheckboxState()
  return (
    <Flex pl="48px" mt="2px">
      {isValidElement(children) &&
        cloneElement(children, {
          onClick: () => {
            console.log('OUTSIDE REF', outsideRef.current)
            if (outsideRef.current) {
              outsideRef.current.checked = true
            }
          },
        })}
    </Flex>
  )
}

// Checkbox.Others = Others

export const CheckboxOthers = () => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isChecked, setIsChecked] = useState(false)

  useEffect(() => {
    console.log('inputref')
    console.log(inputRef?.current?.value)
    if (isChecked && !!inputRef?.current?.value) {
      setIsChecked(true)
    }
  }, [isChecked, setIsChecked])

  return (
    <>
      <ChakraCheckbox isChecked={isChecked} />
      <Input ref={inputRef} />
    </>
  )
}
