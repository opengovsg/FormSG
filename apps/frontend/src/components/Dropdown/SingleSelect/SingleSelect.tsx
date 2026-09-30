import { forwardRef } from 'react'

import { SelectCombobox } from '../components/SelectCombobox'
import { SelectMenu } from '../components/SelectMenu'
import { SelectPopoverProvider } from '../components/SelectPopover'

import {
  SingleSelectProvider,
  SingleSelectProviderProps,
} from './SingleSelectProvider'

export type SingleSelectProps = Omit<SingleSelectProviderProps, 'children'> & {
  /** Render the menu inline when the select is inside a modal. */
  usePortal?: boolean
}

export const SingleSelect = forwardRef<HTMLInputElement, SingleSelectProps>(
  ({ usePortal = true, ...props }, ref): JSX.Element => {
    return (
      <SingleSelectProvider {...props}>
        <SelectPopoverProvider>
          <SelectCombobox ref={ref} />
          <SelectMenu usePortal={usePortal} />
        </SelectPopoverProvider>
      </SingleSelectProvider>
    )
  },
)
