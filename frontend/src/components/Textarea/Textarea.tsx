import ResizeTextarea, { TextareaAutosizeProps } from 'react-textarea-autosize'
import {
  forwardRef,
  Textarea as ChakraTextarea,
  TextareaProps as ChakraTextareaProps,
} from '@chakra-ui/react'

export interface TextareaProps extends ChakraTextareaProps {
  /**
   * The minimum rows the textarea displays on render.
   * Defaults to `3`.
   */
  minAutosizeRows?: TextareaAutosizeProps['minRows']
  /**
   * The maximum rows the textarea will automatically resize to.
   * Defaults to `6`.
   */
  maxAutosizeRows?: TextareaAutosizeProps['maxRows']

  /**
   * Whether the input is in a prefilled state.
   */
  isPrefilled?: boolean
  /**
   * Whether the input is in a success state.
   */
  isSuccess?: boolean
}

export const Textarea = forwardRef<TextareaProps, 'textarea'>(
  (
    { minAutosizeRows: minRows = 3, maxAutosizeRows: maxRows = 6, ...props },
    ref,
  ) => {
    return (
      <ChakraTextarea
        //Chakra sets a default minH which prevents autosize to control starting height.
        // Set here instead of on the theme to prevent all base text areas from having no minH.
        minH="unset"
        ref={ref}
        as={ResizeTextarea}
        minRows={minRows}
        maxRows={maxRows}
        {...props}
      />
    )
  },
)
