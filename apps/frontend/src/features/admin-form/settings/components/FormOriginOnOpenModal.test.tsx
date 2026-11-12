import { PropsWithChildren } from 'react'
import { ChakraProvider, theme } from '@chakra-ui/react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { FormOrigin } from 'formsg-shared/types/form/form'

import { FormOriginOnOpenModal } from './FormOriginOnOpenModal'

vi.mock('react-i18next', () => {
  const P = 'features.workspace.modals.forms.create.origin'
  const translations: Record<string, string> = {
    [`${P}.question`]: 'Before FormSG, how did you collect this?',
    [`${P}.options.digitalNew`]: 'Not collected',
    [`${P}.options.digitalExisting`]: 'Digitally',
    [`${P}.options.paper`]: 'On paper',
    [`${P}.errors.required`]: 'Please select an option.',
    [`${P}.cta.next`]: 'Next step',
  }
  return {
    useTranslation: () => ({ t: (k: string) => translations[k] ?? k }),
    Trans: ({ children }: PropsWithChildren) => children,
  }
})

const renderModal = () => {
  const onSubmit = vi.fn()
  render(
    <ChakraProvider theme={theme}>
      <FormOriginOnOpenModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        isLoading={false}
      />
    </ChakraProvider>,
  )
  return { onSubmit }
}

const clickNext = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /next step/i }))
}

describe('FormOriginOnOpenModal', () => {
  it('asks "Before FormSG, how did you collect this?" with the three answers in order', () => {
    renderModal()

    expect(
      screen.getByText('Before FormSG, how did you collect this?'),
    ).toBeInTheDocument()
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(3)
    expect(radios[0]).toHaveAccessibleName('Not collected')
    expect(radios[1]).toHaveAccessibleName('Digitally')
    expect(radios[2]).toHaveAccessibleName('On paper')
  })

  it('blocks Next and shows an error when no answer is chosen', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderModal()

    await clickNext(user)

    expect(
      await screen.findByText('Please select an option.'),
    ).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it.each([
    ['Not collected', FormOrigin.DigitalNew],
    ['Digitally', FormOrigin.DigitalExisting],
    ['On paper', FormOrigin.Paper],
  ])('submits "%s" as the origin', async (label, expected) => {
    const user = userEvent.setup()
    const { onSubmit } = renderModal()

    await user.click(screen.getByRole('radio', { name: label }))
    await clickNext(user)

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expected))
  })
})
