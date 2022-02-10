import { forwardRef } from 'react'

import { SelectCombobox } from '../elements/SelectCombobox'
import { SelectMenu } from '../elements/SelectMenu'
import { SelectPopoverProvider } from '../elements/SelectPopover'
import {
  SingleSelectProvider,
  SingleSelectProviderProps,
} from '../SingleSelectProvider'

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
