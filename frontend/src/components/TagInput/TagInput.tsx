import {
  FocusEventHandler,
  KeyboardEvent,
  SyntheticEvent,
  useCallback,
  useRef,
} from 'react'
import { RovingTabIndexProvider } from 'react-roving-tabindex'
import {
  Box,
  forwardRef,
  StylesProvider,
  useControllableState,
  useFormControl,
  useMergeRefs,
  useMultiStyleConfig,
} from '@chakra-ui/react'

import { InputProps } from '~components/Input'
import { TagProps } from '~components/Tag/Tag'

import { TagInputInput } from './TagInputInput'
import { TagInputTag } from './TagInputTag'

export interface TagInputProps
  extends Omit<InputProps, 'value' | 'onChange' | 'defaultValue'> {
  /** Value of the controlled input. */
  value?: string[]
  /**
   * Callback for when the value changes.
   * @param value - The new value.
   */
  onChange?: (value: string[]) => void
  /** Default value of the uncontrolled input. */
  defaultValue?: string[]
  /** Color scheme to assign to the created tags  */
  tagColorScheme?: TagProps['colorScheme']
  /** Keys that will trigger the creation of new tags. Defaults to `['Enter', ',', ' ']` */
  keyDownKeys?: string[]
  /**
   * Optional function to call to validate created tags.
   * Should return `true` if tag is valid.
   * If no function is provided, all tags are considered valid.
   */
  tagValidation?: (tag: string) => boolean

  /**
   * Optional function to call when input is blurred.
   */
  onBlur?: (event: SyntheticEvent) => void
  /**
   * If true, duplicate tags will not be created. Defaults to `true`.
   */
  preventDuplicates?: boolean
}

export const TagInput = forwardRef<TagInputProps, 'input'>(
  (
    {
      value: valueProp,
      defaultValue = [],
      onChange: onChangeProp,
      onKeyDown,
      onBlur,
      keyDownKeys = ['Enter', ',', ' '],
      tagColorScheme = 'secondary',
      tagValidation = () => true,
      size,
      preventDuplicates = true,
      ...props
    },
    ref,
  ): JSX.Element => {
    const inputProps = useFormControl<HTMLInputElement>(props)
    const styles = useMultiStyleConfig('TagInput', inputProps)

    const [value, onChange] = useControllableState({
      value: valueProp,
      onChange: onChangeProp,
      defaultValue,
    })

    const inputRef = useRef<HTMLInputElement>(null)
    const mergedInputRefs = useMergeRefs(ref, inputRef)

    const handleFieldClick = useCallback(() => {
      inputRef.current?.focus()
    }, [])

    const addTag = useCallback(
      (event: SyntheticEvent, tag: string) => {
        if (event.isDefaultPrevented()) return
        if (preventDuplicates) {
          if (value.includes(tag)) return
          onChange(Array.from(new Set([...value, ...tag.split(',')])))
        } else {
          onChange(value.concat(tag.split(',')))
        }
      },
      [onChange, preventDuplicates, value],
    )
    const removeTag = useCallback(
      (event: SyntheticEvent, index: number) => {
        if (event.isDefaultPrevented()) return

        onChange([...value.slice(0, index), ...value.slice(index + 1)])
      },
      [onChange, value],
    )
    const handleRemoveTag = useCallback(
      (index: number) => (event: SyntheticEvent) => {
        removeTag(event, index)
      },
      [removeTag],
    )

    const handleBlur: FocusEventHandler<HTMLInputElement> = useCallback(
      (event) => {
        const currentValue = event.target.value
        // No value to add a tag to.
        if (!currentValue.trim()) {
          event.target.value = ''
        } else {
          addTag(event, currentValue)
          if (!event.isDefaultPrevented()) {
            event.target.value = ''
          }
          event.preventDefault()
        }
        onBlur?.(event)
      },
      [addTag, onBlur],
    )

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLInputElement>) => {
        onKeyDown?.(event)

        if (event.isDefaultPrevented()) return
        if (event.isPropagationStopped()) return

        const { currentTarget, key } = event
        const { selectionStart, selectionEnd } = currentTarget
        if (
          key === 'Backspace' &&
          value.length > 0 &&
          selectionStart === 0 &&
          selectionEnd === 0
        ) {
          return removeTag(event, value.length - 1)
        }
        if (!currentTarget.value.trim()) return // No value to add a tag to.
        if (keyDownKeys.indexOf(key) > -1 && currentTarget.value) {
          addTag(event, currentTarget.value)
          if (!event.isDefaultPrevented()) {
            currentTarget.value = ''
          }
          event.preventDefault()
        }
      },
      [onKeyDown, keyDownKeys, value.length, addTag, removeTag],
    )

    return (
      <RovingTabIndexProvider>
        <StylesProvider value={styles}>
          <Box
            sx={styles.container}
            onClick={handleFieldClick}
            aria-disabled={inputProps.disabled}
            aria-invalid={inputProps['aria-invalid']}
            aria-readonly={inputProps.readOnly}
          >
            {value.map((tag, index) => (
              <TagInputTag
                isDisabled={inputProps.disabled}
                key={index}
                colorScheme={tagColorScheme}
                isInvalid={!tagValidation(tag)}
                label={tag}
                onClearTag={handleRemoveTag(index)}
                onBlur={onBlur}
              />
            ))}
            <TagInputInput
              {...inputProps}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              ref={mergedInputRefs}
            />
          </Box>
        </StylesProvider>
      </RovingTabIndexProvider>
    )
  },
)
