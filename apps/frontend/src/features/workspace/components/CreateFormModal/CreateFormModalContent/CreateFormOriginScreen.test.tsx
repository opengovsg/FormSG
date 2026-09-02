import { PropsWithChildren } from 'react'
import { useForm } from 'react-hook-form'
import { ChakraProvider, Modal, ModalContent, theme } from '@chakra-ui/react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  CLIENT_CHECKBOX_OTHERS_INPUT_VALUE,
  FORM_ORIGIN_OTHER_DETAIL_MAX_LENGTH,
} from 'formsg-shared/constants'
import { FormOrigin, FormResponseMode } from 'formsg-shared/types/form/form'

import {
  CreateFormWizardContextReturn,
  CreateFormWizardInputProps,
} from '../CreateFormWizardContext'

import { CreateFormOriginScreen } from './CreateFormOriginScreen'

vi.mock('react-i18next', () => {
  const P = 'features.workspace.modals.forms.create.origin'
  const translations: Record<string, string> = {
    [`${P}.topicSentence`]: 'Tell us about your process',
    [`${P}.q1.label`]: 'Is this form based on a new or existing process?',
    [`${P}.q1.options.new`]: 'New',
    [`${P}.q1.options.existing`]: 'Existing',
    [`${P}.q2.label`]: 'How is this data being collected today?',
    [`${P}.q2.options.paper`]: 'Paper form',
    [`${P}.q2.options.digitalEmail`]: 'Emails',
    [`${P}.q2.options.digitalDocument`]: 'Documents (e.g. PDF, Word)',
    [`${P}.q2.options.digitalSpreadsheet`]: 'Spreadsheets (e.g. Excel, Sheets)',
    [`${P}.q2.options.digitalFormbuilder`]: 'An online form (e.g. FormSG)',
    [`${P}.q2.options.others`]: 'Other',
    [`${P}.otherInputLabel`]: 'Other source',
    [`${P}.errors.q1Required`]: 'Please select an option.',
    [`${P}.errors.atLeastOne`]: 'Please select at least 1 option.',
    [`${P}.errors.otherRequired`]:
      'Please specify a value for the "others" option',
    [`${P}.errors.otherMaxLength`]:
      'Please use {maxLength} characters or fewer.',
    [`${P}.cta.next`]: 'Next step',
    [`${P}.cta.back`]: 'Back',
  }
  const interpolate = (s: string, opts?: Record<string, unknown>) =>
    opts
      ? s.replace(/\{(\w+)\}/g, (_, key) =>
          key in opts ? String(opts[key]) : `{${key}}`,
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

const selectExisting = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('radio', { name: 'Existing' }))
}

describe('CreateFormOriginScreen', () => {
  it('renders the topic sentence as the header and Q1 as a radio with New/Existing, with Q2 absent', () => {
    renderOriginScreen()

    expect(screen.getByText('Tell us about your process')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'New' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Existing' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Paper form')).not.toBeInTheDocument()
  })

  it('keeps Q2 hidden when Q1 = New is actively selected, and shows it when Q1 = Existing is selected', async () => {
    const user = userEvent.setup()
    renderOriginScreen()

    await user.click(screen.getByRole('radio', { name: 'New' }))
    expect(screen.queryByLabelText('Paper form')).not.toBeInTheDocument()

    await selectExisting(user)
    expect(screen.getByLabelText('Paper form')).toBeInTheDocument()
  })

  it('blocks submission and shows an error when no origin is selected', async () => {
    const user = userEvent.setup()
    const { onCreate } = renderOriginScreen()

    await clickNext(user)

    expect(
      await screen.findByText('Please select an option.'),
    ).toBeInTheDocument()
    expect(onCreate).not.toHaveBeenCalled()
  })

  it("shows only Q2's error (not Q1's) when Q1 = Existing but Q2 is left empty", async () => {
    const user = userEvent.setup()
    const { onCreate } = renderOriginScreen()

    await selectExisting(user)
    await clickNext(user)

    const errors = await screen.findAllByText(
      'Please select at least 1 option.',
    )
    expect(errors).toHaveLength(1)
    expect(onCreate).not.toHaveBeenCalled()
  })

  it('creates the form with the selected origins when at least one is chosen', async () => {
    const user = userEvent.setup()
    const { onCreate } = renderOriginScreen()

    await selectExisting(user)
    await user.click(screen.getByLabelText('Paper form'))
    await user.click(screen.getByLabelText('Spreadsheets (e.g. Excel, Sheets)'))
    await clickNext(user)

    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1))
    expect(onCreate.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        formOrigins: expect.objectContaining({
          value: expect.arrayContaining([
            FormOrigin.Paper,
            FormOrigin.DigitalSpreadsheet,
          ]),
        }),
      }),
    )
  })

  it('offers "An online form (e.g. FormSG)" as a medium option', async () => {
    const user = userEvent.setup()
    const { onCreate } = renderOriginScreen()

    await selectExisting(user)
    expect(
      screen.getByLabelText('An online form (e.g. FormSG)'),
    ).toBeInTheDocument()

    await user.click(screen.getByLabelText('An online form (e.g. FormSG)'))
    await clickNext(user)

    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1))
    expect(onCreate.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        formOrigins: expect.objectContaining({
          value: [FormOrigin.DigitalFormBuilder],
        }),
      }),
    )
  })

  it('creates the form when Q1 = New is selected, without requiring an answer to Q2', async () => {
    const user = userEvent.setup()
    const { onCreate } = renderOriginScreen()

    await user.click(screen.getByRole('radio', { name: 'New' }))
    await clickNext(user)

    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1))
    expect(onCreate.mock.calls[0][0]).toEqual(
      expect.objectContaining({ formOriginProcess: 'new' }),
    )
  })

  it('restores previously ticked Q2 options after switching to New and back to Existing', async () => {
    const user = userEvent.setup()
    renderOriginScreen()

    await selectExisting(user)
    await user.click(screen.getByLabelText('Paper form'))

    await user.click(screen.getByRole('radio', { name: 'New' }))
    expect(screen.queryByLabelText('Paper form')).not.toBeInTheDocument()

    await selectExisting(user)
    expect(screen.getByLabelText('Paper form')).toBeChecked()
  })

  it('requires the free-text detail when "Other" is selected', async () => {
    const user = userEvent.setup()
    const { onCreate } = renderOriginScreen()

    await selectExisting(user)
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

    await selectExisting(user)
    await user.click(screen.getByLabelText('Other'))
    await user.type(screen.getByLabelText('Other source'), 'Carrier pigeon')

    expect(
      screen.getByText(`(14/${FORM_ORIGIN_OTHER_DETAIL_MAX_LENGTH})`),
    ).toBeInTheDocument()
  })

  it(`blocks submission when the "Other" detail exceeds ${FORM_ORIGIN_OTHER_DETAIL_MAX_LENGTH} characters`, async () => {
    const user = userEvent.setup()
    const { onCreate } = renderOriginScreen()

    await selectExisting(user)
    await user.click(screen.getByLabelText('Other'))
    const input = screen.getByLabelText('Other source')
    await user.click(input)
    await user.paste('a'.repeat(FORM_ORIGIN_OTHER_DETAIL_MAX_LENGTH + 1))
    await clickNext(user)

    expect(
      await screen.findByText(
        new RegExp(`${FORM_ORIGIN_OTHER_DETAIL_MAX_LENGTH} characters`, 'i'),
      ),
    ).toBeInTheDocument()
    expect(onCreate).not.toHaveBeenCalled()
  })

  it('marks "Other" with the checkbox sentinel and carries the typed detail', async () => {
    const user = userEvent.setup()
    const { onCreate } = renderOriginScreen()

    await selectExisting(user)
    await user.click(screen.getByLabelText('Other'))
    await user.type(screen.getByLabelText('Other source'), 'Carrier pigeon')
    await clickNext(user)

    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1))
    expect(onCreate.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        formOrigins: {
          value: [CLIENT_CHECKBOX_OTHERS_INPUT_VALUE],
          othersInput: 'Carrier pigeon',
        },
      }),
    )
  })

  it('returns to the title step when Back is pressed', async () => {
    const user = userEvent.setup()
    const { goToFormDetails } = renderOriginScreen()

    await user.click(screen.getByRole('button', { name: /back/i }))

    expect(goToFormDetails).toHaveBeenCalledTimes(1)
  })
})
