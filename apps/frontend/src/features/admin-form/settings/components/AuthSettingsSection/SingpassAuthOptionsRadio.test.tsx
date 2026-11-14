import { fireEvent, screen } from '@testing-library/react'

import { FormAuthType, FormSettings, FormStatus } from 'formsg-shared/types'

import { render } from '~/test-utils'

import { SingpassAuthOptionsRadio } from './SingpassAuthOptionsRadio'

const state = vi.hoisted(() => ({ mutate: vi.fn(), loading: false }))
vi.mock('../../mutations', () => ({
  useMutateFormSettings: () => ({
    mutateFormAuthType: { mutate: state.mutate, isLoading: state.loading },
  }),
}))
vi.mock('./EsrvcIdBox', () => ({ EsrvcIdBox: () => null }))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key.split('.').at(-1) }),
}))
const setup = (authType: FormAuthType, isDisabled = false) =>
  render(
    <SingpassAuthOptionsRadio
      settings={{ authType, status: FormStatus.Private } as FormSettings}
      isDisabled={isDisabled}
    />,
  )

beforeEach(() => {
  state.mutate.mockClear()
  state.loading = false
})
it('preserves legacy SP without converting it to Myinfo on render or reselect', () => {
  setup(FormAuthType.SP)
  const selected = screen.getByRole('radio', {
    name: 'singpass legacySingpassDescription',
  })
  expect(selected).toBeChecked()
  expect(selected).toHaveAttribute('value', FormAuthType.SP)
  fireEvent.click(selected, { clientX: 10, clientY: 10 })
  expect(state.mutate).not.toHaveBeenCalled()
})
it('sends NIL through the existing mutation when disabling login', () => {
  setup(FormAuthType.MyInfo)
  fireEvent.click(screen.getByRole('radio', { name: 'noLogin' }), {
    clientX: 10,
    clientY: 10,
  })
  expect(state.mutate).toHaveBeenCalledWith(FormAuthType.NIL)
})
it.each(['disabled', 'saving'])('prevents switching when %s', (reason) => {
  state.loading = reason === 'saving'
  setup(FormAuthType.CP, reason === 'disabled')
  const option = screen.getByRole('radio', { name: 'noLogin' })
  expect(option).toBeDisabled()
  fireEvent.click(option, { clientX: 10, clientY: 10 })
  expect(state.mutate).not.toHaveBeenCalled()
})

it.each([
  FormAuthType.NIL,
  FormAuthType.MyInfo,
  FormAuthType.CP,
  FormAuthType.SP,
])('reflects saved %s without mutating it', (authType) => {
  setup(authType)
  expect(screen.getByRole('radio', { checked: true })).toHaveAttribute(
    'value',
    authType,
  )
  expect(screen.getAllByRole('radio')).toHaveLength(3)
  expect(state.mutate).not.toHaveBeenCalled()
})
