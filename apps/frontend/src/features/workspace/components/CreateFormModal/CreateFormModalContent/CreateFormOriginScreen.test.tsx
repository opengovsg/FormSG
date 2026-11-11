import { PropsWithChildren } from 'react'
import { useForm } from 'react-hook-form'
import { ChakraProvider, Modal, ModalContent, theme } from '@chakra-ui/react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { FormOrigin, FormResponseMode } from 'formsg-shared/types/form/form'

import {
  CreateFormWizardContextReturn,
  CreateFormWizardInputProps,
} from '../CreateFormWizardContext'

import { CreateFormOriginScreen } from './CreateFormOriginScreen'

vi.mock('react-i18next', () => {
  const P = 'features.workspace.modals.forms.create.origin'
  const translations: Record<string, string> = {
    [`${P}.question`]: "What's this form for?",
    [`${P}.options.digitalNew`]: 'Starting a completely new process',
    [`${P}.options.digitalExisting`]:
      'Improving something we already collect digitally',
    [`${P}.options.paper`]: 'Replacing a paper form/manual process',
    [`${P}.errors.required`]: 'Please select an option.',
    [`${P}.cta.next`]: 'Next step',
    [`${P}.cta.back`]: 'Back',
  }
  return {
    useTranslation: () => ({ t: (k: string) => translations[k] ?? k }),
    Trans: ({ children }: PropsWithChildren) => children,
  }
})

const renderOriginScreen = () => {
  const onCreate = vi.fn()
  const goToFormDetails = vi.fn()

  const Harness = () => {
    const formMethods = useForm<CreateFormWizardInputProps>({
      defaultValues: {
        title: 'My form',
        responseMode: FormResponseMode.Multirespondent,
      },
    })
    const mockHook = () =>
      ({
        formMethods,
        handleCreateStorageModeOrMultirespondentForm:
          formMethods.handleSubmit(onCreate),
        goToFormDetails,
        isLoading: false,
      }) as unknown as CreateFormWizardContextReturn

    return (
      <ChakraProvider theme={theme}>
        <Modal isOpen onClose={() => undefined}>
          <ModalContent>
            <CreateFormOriginScreen useCreateFormWizardParam={mockHook} />
          </ModalContent>
        </Modal>
      </ChakraProvider>
    )
  }

  render(<Harness />)
  return { onCreate, goToFormDetails }
}

const clickNext = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /next step/i }))
}

describe('CreateFormOriginScreen', () => {
  it('asks "What\'s this form for?" with the three answers in order', () => {
    renderOriginScreen()

    expect(screen.getByText("What's this form for?")).toBeInTheDocument()
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(3)
    expect(radios[0]).toHaveAccessibleName('Starting a completely new process')
    expect(radios[1]).toHaveAccessibleName(
      'Improving something we already collect digitally',
    )
    expect(radios[2]).toHaveAccessibleName(
      'Replacing a paper form/manual process',
    )
  })

  it('blocks submission and shows an error when no answer is chosen', async () => {
    const user = userEvent.setup()
    const { onCreate } = renderOriginScreen()

    await clickNext(user)

    expect(
      await screen.findByText('Please select an option.'),
    ).toBeInTheDocument()
    expect(onCreate).not.toHaveBeenCalled()
  })

  it.each([
    ['Starting a completely new process', FormOrigin.DigitalNew],
    [
      'Improving something we already collect digitally',
      FormOrigin.DigitalExisting,
    ],
    ['Replacing a paper form/manual process', FormOrigin.Paper],
  ])(
    'creates the form with "%s" as the origin, without a follow-up question',
    async (label, expected) => {
      const user = userEvent.setup()
      const { onCreate } = renderOriginScreen()

      await user.click(screen.getByRole('radio', { name: label }))
      expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
      await clickNext(user)

      await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1))
      expect(onCreate.mock.calls[0][0]).toEqual(
        expect.objectContaining({ formOrigin: expected }),
      )
    },
  )

  it('returns to the title step when Back is pressed', async () => {
    const user = userEvent.setup()
    const { goToFormDetails } = renderOriginScreen()

    await user.click(screen.getByRole('button', { name: /back/i }))

    expect(goToFormDetails).toHaveBeenCalledTimes(1)
  })
})
