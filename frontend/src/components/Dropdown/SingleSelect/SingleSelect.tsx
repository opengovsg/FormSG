import { forwardRef } from 'react'

import { SelectCombobox } from '../components/SelectCombobox'
import { SelectMenu } from '../components/SelectMenu'
import { SelectPopoverProvider } from '../components/SelectPopover'

import {
  SingleSelectProvider,
  SingleSelectProviderProps,
} from './SingleSelectProvider'

export type SingleSelectProps = Omit<SingleSelectProviderProps, 'children'>

export const SingleSelect = forwardRef<HTMLInputElement, SingleSelectProps>(
  (props, ref): JSX.Element => {
    return (
      <SingleSelectProvider {...props}>
        <SelectPopoverProvider>
          <SelectCombobox ref={ref} />
          <SelectMenu />
        </SelectPopoverProvider>
      </SingleSelectProvider>
    )
  },
)
