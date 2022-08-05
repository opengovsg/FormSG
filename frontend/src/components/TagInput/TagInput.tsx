import {
  FocusEventHandler,
  KeyboardEvent,
  SyntheticEvent,
  useCallback,
} from 'react'
import { RovingTabIndexProvider } from 'react-roving-tabindex'
import {
  Box,
  Flex,
  forwardRef,
  useControllableState,
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
}

export const TagInput = forwardRef<TagInputProps, 'input'>(
  (
    {
      value: valueProp,
      defaultValue = [],
      onChange: onChangeProp,
      onKeyDown,
      keyDownKeys = ['Enter', ',', ' '],
      tagColorScheme = 'secondary',
      size,
      ...props
    },
    ref,
  ): JSX.Element => {
    const inputStyle = useMultiStyleConfig('Input', { size, ...props })

    const [value, onChange] = useControllableState({
      value: valueProp,
      onChange: onChangeProp,
      defaultValue,
    })

    const addTag = useCallback(
      (event: SyntheticEvent, tag: string) => {
        if (event.isDefaultPrevented()) return

        onChange(value.concat([tag]))
      },
      [onChange, value],
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
      },
      [addTag],
    )

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLInputElement>) => {
        onKeyDown?.(event)

        if (event.isDefaultPrevented()) return
        if (event.isPropagationStopped()) return

        const { currentTarget, key } = event
        const { selectionStart, selectionEnd } = currentTarget
        if (
          key === 'Delete' &&
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
        <Box
          sx={{
            ...inputStyle.field,
            display: 'flex',
            flexWrap: 'wrap',
            p: '0.375rem',
            minH: '2.75rem',
            cursor: 'pointer',
            _disabled: {
              cursor: 'not-allowed',
            },
            transitionProperty: 'common',
            transitionDuration: 'normal',
            borderRadius: '4px',
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //@ts-ignore
            _focusWithin: inputStyle.field._focus,
            height: 'auto',
            maxW: '100%',
            w: '100%',
          }}
        >
          <Flex
            flexWrap="wrap"
            align="center"
            maxW="inherit"
            w="100%"
            gap="0.25rem"
          >
            {value.map((tag, index) => (
              <TagInputTag
                key={index}
                colorScheme={tagColorScheme}
                label={tag}
                onClose={handleRemoveTag(index)}
              />
            ))}
            <TagInputInput
              flexGrow={1}
              {...props}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              ref={ref}
            />
          </Flex>
        </Box>
      </RovingTabIndexProvider>
    )
  },
)
