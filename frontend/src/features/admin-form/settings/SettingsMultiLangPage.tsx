import { CategoryHeader } from './components/CategoryHeader'
import { FormMultiLangToggle } from './components/FormMultiLangToggle'

export const SettingsMultiLangPage = (): JSX.Element => {
  return (
    <>
      <CategoryHeader>Multi-language</CategoryHeader>
      <FormMultiLangToggle />
    </>
  )
}
