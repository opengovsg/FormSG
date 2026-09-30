import { ChakraProvider } from '@chakra-ui/react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Language } from 'formsg-shared/types'

import i18n from '~/i18n/i18n'

import { theme } from '~theme/index'

import { SaveViewModal } from './SaveViewModal'

const renderModal = () => {
  const onSave = vi.fn()
  render(
    <ChakraProvider theme={theme}>
      <SaveViewModal isOpen onClose={vi.fn()} onSave={onSave} />
    </ChakraProvider>,
  )
  return { onSave }
}

const saveWithName = async (name: string) => {
  await userEvent.type(screen.getByRole('textbox'), name)
  await userEvent.click(screen.getByRole('button', { name: /^save$/i }))
}

describe('the save view modal', () => {
  beforeAll(() => i18n.changeLanguage(Language.ENGLISH))

  it('saves a name of 50 characters', async () => {
    const { onSave } = renderModal()

    await saveWithName('a'.repeat(50))

    expect(onSave).toHaveBeenCalledWith('a'.repeat(50))
  })

  it('refuses a name over 50 characters, and says why', async () => {
    const { onSave } = renderModal()

    await saveWithName('a'.repeat(51))

    expect(
      await screen.findByText('View name must be at most 50 characters'),
    ).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })
})
