import { startTransition, useCallback, useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { act, screen } from '@testing-library/react'

import { BasicField, FormFieldDto } from 'formsg-shared/types/field'
import { FormColorTheme, FormResponseMode } from 'formsg-shared/types/form'

import { render } from '~/test-utils'

import { FormFieldValues } from '~templates/Field'

import * as PublicFormContextModule from '~features/public-form/PublicFormContext'

import { FormFields, PrefillMap } from './FormFields'

vi.mock('~features/public-form/PublicFormContext', async () => {
  const { createContext, useContext } = await import('react')
  const TestPublicFormContext = createContext<Record<string, unknown>>({})
  return {
    TestPublicFormContext,
    usePublicFormContext: () => useContext(TestPublicFormContext),
  }
})

vi.mock(
  '~features/public-form/hooks/useFetchPrefillQuery',
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import('~features/public-form/hooks/useFetchPrefillQuery')
      >()
    const { useEffect } = await import('react')
    const { usePublicFormContext } =
      await import('~features/public-form/PublicFormContext')
    return {
      ...actual,
      useFetchPrefillQuery: () => {
        const { restorePrefillQuery } = usePublicFormContext() as unknown as {
          restorePrefillQuery: () => void
        }
        useEffect(() => restorePrefillQuery(), [restorePrefillQuery])
        return false
      },
    }
  },
)

vi.mock('./FormSectionsContext', async (importOriginal) => {
  const formSections = { setVisibleFieldIdsForScrollData: () => {} }
  return {
    ...(await importOriginal<typeof import('./FormSectionsContext')>()),
    useFormSections: () => formSections,
  }
})

vi.mock('../FormPaymentPage/FormPaymentResumeModal', () => ({
  PublicFormPaymentResumeModal: () => null,
}))

vi.mock('./PublicFormSubmitButton', () => ({
  PublicFormSubmitButton: () => null,
}))

const { TestPublicFormContext } =
  PublicFormContextModule as unknown as typeof PublicFormContextModule & {
    TestPublicFormContext: React.Context<Record<string, unknown>>
  }

const MOBILE_ID = '6a7d150943f45a63aa49c582'
const CHECKBOX_ID = '691aea63c1e491c2673357e4'
const SHORT_TEXT_ID = '6ae2b7712ca034bb64464fd5'
const MYINFO_MOBILE = '+6598765432'
const PREFILL_VALUE = 'StaffSignUps'

const mobileField = {
  _id: MOBILE_ID,
  fieldType: BasicField.Mobile,
  title: 'Mobile',
  description: '',
  required: true,
  disabled: false,
  allowIntlNumbers: false,
  isVerifiable: false,
}

const checkboxField = {
  _id: CHECKBOX_ID,
  fieldType: BasicField.Checkbox,
  title: 'Checkbox',
  description: '',
  required: false,
  disabled: false,
  fieldOptions: ['Option'],
  othersRadioButton: false,
  validateByValue: false,
  ValidationOptions: { customMin: null, customMax: null },
}

const shortTextField = {
  _id: SHORT_TEXT_ID,
  fieldType: BasicField.ShortText,
  title: 'Short answer',
  description: '',
  required: false,
  disabled: false,
  allowPrefill: true,
  lockPrefill: false,
  ValidationOptions: { selectedValidation: null, customVal: null },
}

const LoggedInPublicForm = ({
  withCheckbox,
  myInfoMobile,
  onLoad,
}: {
  withCheckbox: boolean
  myInfoMobile: string
  onLoad: (load: () => void) => void
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [searchParams, setSearchParams] = useState(new URLSearchParams())
  onLoad(() => setIsLoaded(true))

  const formFields = useMemo(
    () =>
      (withCheckbox
        ? [mobileField, checkboxField, shortTextField]
        : [mobileField, shortTextField]) as unknown as FormFieldDto[],
    [withCheckbox],
  )

  const fieldPrefillMap = useMemo(() => {
    const prefillMap: PrefillMap = {}
    const prefillValue = searchParams.get(SHORT_TEXT_ID)
    if (prefillValue !== null) {
      prefillMap[SHORT_TEXT_ID] = { prefillValue, lockPrefill: false }
    }
    return prefillMap
  }, [searchParams])

  const defaultFormValues = useMemo<FormFieldValues>(
    () =>
      isLoaded
        ? {
            [MOBILE_ID]: myInfoMobile ? { value: myInfoMobile } : '',
            ...(withCheckbox ? { [CHECKBOX_ID]: '' } : {}),
            [SHORT_TEXT_ID]: fieldPrefillMap[SHORT_TEXT_ID]?.prefillValue ?? '',
          }
        : {},
    [isLoaded, myInfoMobile, withCheckbox, fieldPrefillMap],
  )

  const formMethods = useForm<FormFieldValues>({
    defaultValues: defaultFormValues,
    mode: 'onTouched',
  })

  const restorePrefillQuery = useCallback(
    () =>
      startTransition(() =>
        setSearchParams(
          new URLSearchParams({ [SHORT_TEXT_ID]: PREFILL_VALUE }),
        ),
      ),
    [],
  )

  return (
    <TestPublicFormContext.Provider
      value={{
        defaultFormValues,
        fieldPrefillMap,
        form: { responseMode: FormResponseMode.Encrypt },
        augmentedFormFields: formFields,
        restorePrefillQuery,
      }}
    >
      <FormProvider {...formMethods}>
        {isLoaded ? (
          <FormFields
            formFields={formFields}
            formLogics={[]}
            colorTheme={FormColorTheme.Blue}
            onSubmit={undefined}
          />
        ) : null}
      </FormProvider>
    </TestPublicFormContext.Provider>
  )
}

const renderAfterSingpassLogin = async ({
  withCheckbox,
  myInfoMobile,
}: {
  withCheckbox: boolean
  myInfoMobile: string
}) => {
  let load = () => {}
  render(
    <LoggedInPublicForm
      withCheckbox={withCheckbox}
      myInfoMobile={myInfoMobile}
      onLoad={(fn) => (load = fn)}
    />,
  )
  await act(async () => load())
}

describe('FormFields prefill restored after Singpass login', () => {
  it('fills the prefill when the form has a MyInfo mobile and a checkbox', async () => {
    await renderAfterSingpassLogin({
      withCheckbox: true,
      myInfoMobile: MYINFO_MOBILE,
    })

    expect(screen.getByRole('textbox', { name: /short answer/i })).toHaveValue(
      PREFILL_VALUE,
    )
  })

  it('fills the prefill when the form has a MyInfo mobile and no checkbox', async () => {
    await renderAfterSingpassLogin({
      withCheckbox: false,
      myInfoMobile: MYINFO_MOBILE,
    })

    expect(screen.getByRole('textbox', { name: /short answer/i })).toHaveValue(
      PREFILL_VALUE,
    )
  })

  it('fills the prefill when the form has a checkbox and an empty mobile', async () => {
    await renderAfterSingpassLogin({
      withCheckbox: true,
      myInfoMobile: '',
    })

    expect(screen.getByRole('textbox', { name: /short answer/i })).toHaveValue(
      PREFILL_VALUE,
    )
  })
})
