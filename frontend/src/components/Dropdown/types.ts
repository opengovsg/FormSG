import type { As } from '@chakra-ui/react'

export type ComboboxItem<T = string> =
  | {
      /** Value to be passed to onChange */
      value: T
      /** Label to render on input when selected. `value` will be used if this is not provided */
      label?: string
      /** Description to render below label if provided */
      description?: string
      /** Whether item is disabled */
      disabled?: boolean
      /** Icon to display in input field when item is selected, if available */
      icon?: As
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any
    }
  | string
  | null
