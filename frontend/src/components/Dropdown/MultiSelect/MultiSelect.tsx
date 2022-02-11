import { forwardRef } from 'react'

import { SelectCombobox } from '../components/SelectCombobox'
import { SelectMenu } from '../components/SelectMenu'
import { SelectPopoverProvider } from '../components/SelectPopover'

import {
  MultiSelectProvider,
  MultiSelectProviderProps,
} from './MultiSelectProvider'

export type MultiSelectProps = Omit<MultiSelectProviderProps, 'children'>

export const MultiSelect = forwardRef<HTMLInputElement, MultiSelectProps>(
  (props, ref): JSX.Element => {
    return (
      <MultiSelectProvider {...props}>
        <SelectPopoverProvider>
          <SelectCombobox ref={ref} />
          <SelectMenu />
        </SelectPopoverProvider>
      </MultiSelectProvider>
    )
  },
)
