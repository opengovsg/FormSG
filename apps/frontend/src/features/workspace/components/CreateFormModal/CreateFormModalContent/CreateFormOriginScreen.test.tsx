import { PropsWithChildren } from 'react'
import { useForm } from 'react-hook-form'
import { ChakraProvider, Modal, ModalContent, theme } from '@chakra-ui/react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CLIENT_CHECKBOX_OTHERS_INPUT_VALUE } from 'formsg-shared/constants'
import { FormOrigin, FormResponseMode } from 'formsg-shared/types/form/form'

import {
  CreateFormWizardContextReturn,
  CreateFormWizardInputProps,
} from '../CreateFormWizardContext'

import { CreateFormOriginScreen } from './CreateFormOriginScreen'

// Origin copy lives in i18n (keyed by FormOrigin code). Map the keys the screen
// renders to their English labels so queries read like what the admin sees.
vi.mock('react-i18next', () => {
  const P = 'features.workspace.modals.forms.create.origin'
  const translations: Record<string, string> = {
    [`${P}.question`]: 'How is this being filled today?',
    [`${P}.options.paper`]: 'Paper form',
    [`${P}.options.digital-new`]: 'This is a new process',
    [`${P}.options.digital-email`]: 'Emails',
    [`${P}.options.digital-document`]: 'Documents (e.g. PDF, Word)',
    [`${P}.options.digital-spreadsheet`]: 'Spreadsheets (e.g. Excel, Sheets)',
    [`${P}.options.digital-formbuilder`]: 'Other form builders',
    [`${P}.options.others`]: 'Other',
    [`${P}.otherInputLabel`]: 'Other source',
    [`${P}.errors.atLeastOne`]: 'Please select at least 1 option.',
    [`${P}.errors.otherRequired`]:
      'Please specify a value for the "others" option',
    [`${P}.errors.otherMaxLength`]:
      'Please use {{maxLength}} characters or fewer.',
    [`${P}.cta.next`]: 'Next step',
    [`${P}.cta.back`]: 'Back',
  }
  // Minimal interpolation so `{{maxLength}}`-style placeholders resolve like i18next.
  const interpolate = (s: string, opts?: Record<string, unknown>) =>
    opts
      ? s.replace(/\{\{(\w+)\}\}/g, (_, key) =>
          key in opts ? String(opts[key]) : `{{${key}}}`,
        )
      : s
  return {
    useTranslation: () => ({
      t: (k: string, opts?: Record<string, unknown>) =>
        interpolate(translations[k] ?? k, opts),
    }),
    Trans: ({ children }: PropsWithChildren) => children,
  }
})

const renderOriginScreen = () => {
  // Captured so assertions can read what the create handler received.
  const onCreate = vi.fn()
  const goBackToDetails = vi.fn()

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
        goBackToDetails,
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
  return { onCreate, goBackToDetails }
}

const clickNext = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /next step/i }))
}

describe('CreateFormOriginScreen', () => {
  it('blocks submission and shows an error when no origin is selected', async () => {
    const user = userEvent.setup()
    const { onCreate } = renderOriginScreen()

    await clickNext(user)

    expect(
      await screen.findByText('Please select at least 1 option.'),
    ).toBeInTheDocument()
    expect(onCreate).not.toHaveBeenCalled()
  })

  it('creates the form with the selected origins when at least one is chosen', async () => {
    const user = userEvent.setup()
    const { onCreate } = renderOriginScreen()

    await user.click(screen.getByLabelText('Paper form'))
    await user.click(screen.getByLabelText('Spreadsheets (e.g. Excel, Sheets)'))
    await clickNext(user)

    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1))
    expect(onCreate.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        formOrigins: expect.arrayContaining([
          FormOrigin.Paper,
          FormOrigin.DigitalSpreadsheet,
        ]),
      }),
    )
  })

  it('requires the free-text detail when "Other" is selected', async () => {
    const user = userEvent.setup()
    const { onCreate } = renderOriginScreen()

    await user.click(screen.getByLabelText('Other'))
    await clickNext(user)

    expect(
      await screen.findByText('Please specify a value for the "others" option'),
    ).toBeInTheDocument()
    expect(onCreate).not.toHaveBeenCalled()
  })

  it('shows a character count helper for the "Other" detail', async () => {
    const user = userEvent.setup()
    renderOriginScreen()

    await user.click(screen.getByLabelText('Other'))
    await user.type(screen.getByLabelText('Other source'), 'Carrier pigeon')

    // "Carrier pigeon" is 14 characters.
    expect(screen.getByText('(14/200)')).toBeInTheDocument()
  })

  it('blocks submission when the "Other" detail exceeds 200 characters', async () => {
    const user = userEvent.setup()
    const { onCreate } = renderOriginScreen()

    await user.click(screen.getByLabelText('Other'))
    const input = screen.getByLabelText('Other source')
    await user.click(input)
    await user.paste('a'.repeat(201))
    await clickNext(user)

    expect(await screen.findByText(/200 characters/i)).toBeInTheDocument()
    expect(onCreate).not.toHaveBeenCalled()
  })

  it('marks "Other" with the checkbox sentinel and carries the typed detail', async () => {
    const user = userEvent.setup()
    const { onCreate } = renderOriginScreen()

    await user.click(screen.getByLabelText('Other'))
    await user.type(screen.getByLabelText('Other source'), 'Carrier pigeon')
    await clickNext(user)

    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1))
    expect(onCreate.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        formOrigins: [CLIENT_CHECKBOX_OTHERS_INPUT_VALUE],
        formOriginOtherDetail: 'Carrier pigeon',
      }),
    )
  })

  it('returns to the title step when Back is pressed', async () => {
    const user = userEvent.setup()
    const { goBackToDetails } = renderOriginScreen()

    await user.click(screen.getByRole('button', { name: /back/i }))

    expect(goBackToDetails).toHaveBeenCalledTimes(1)
  })
})
