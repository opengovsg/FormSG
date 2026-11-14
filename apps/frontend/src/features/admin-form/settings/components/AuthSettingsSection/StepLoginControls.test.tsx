import { useState } from 'react'
import { fireEvent, screen } from '@testing-library/react'

import { FormAuthType } from 'formsg-shared/types'

import { render } from '~/test-utils'

import { StepLoginControls } from './StepLoginControls'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key.split('.').at(-1) }),
}))

it.each([FormAuthType.NIL, FormAuthType.CP])(
  'restores saved legacy Singpass after switching to %s and back',
  (otherProvider) => {
    const onChange = vi.fn()
    const Controls = () => {
      const [authType, setAuthType] = useState(FormAuthType.SP)
      return (
        <StepLoginControls
          savedAuthType={FormAuthType.SP}
          authType={authType}
          esrvcId=""
          isDisabled={false}
          idPrefix="legacy-test"
          onEsrvcIdChange={vi.fn()}
          onAuthTypeChange={(next) => {
            setAuthType(next)
            onChange(next)
          }}
        />
      )
    }
    render(<Controls />)
    fireEvent.click(
      screen.getByRole('radio', {
        name: otherProvider === FormAuthType.NIL ? 'noLogin' : /corppass /,
      }),
    )
    fireEvent.click(screen.getByRole('radio', { name: /^singpass / }))
    expect(onChange).toHaveBeenLastCalledWith(FormAuthType.SP)
    expect(screen.getByRole('radio', { name: /^singpass / })).toHaveAttribute(
      'value',
      FormAuthType.SP,
    )
  },
)
