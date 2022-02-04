export type ComboboxItem =
  | {
      /** Value to be passed to onChange */
      value: string
      /** Label to render on input when selected. `value` will be used if this is not provided */
      label?: string
      /** Description to render below label if provided */
      description?: string
      /** Whether item is disabled */
      disabled?: boolean

      [key: string]: any
    }
  | string
  | null
