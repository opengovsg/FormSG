import { SelectCombobox } from '../elements/SelectCombobox'
import { SelectMenu } from '../elements/SelectMenu'
import {
  SingleSelectProvider,
  SingleSelectProviderProps,
} from '../SingleSelectProvider'

export type SingleSelectProps = Omit<SingleSelectProviderProps, 'children'>

export const SingleSelect = (props: SingleSelectProps): JSX.Element => {
  return (
    <SingleSelectProvider {...props}>
      <SelectCombobox />
      <SelectMenu />
    </SingleSelectProvider>
  )
}
