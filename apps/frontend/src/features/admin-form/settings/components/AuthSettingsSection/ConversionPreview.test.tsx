import { render, screen } from '@testing-library/react'

import { FormAuthType } from 'formsg-shared/types/form'
import { getLoginIdentityAttrsForAuthType } from 'formsg-shared/utils/login-identity'

import { ConversionPreview } from './ConversionPreview'

vi.mock('~templates/Field/Nric/NricField', () => ({
  NricField: () => <div>NRIC/FIN field</div>,
}))
vi.mock('~templates/Field/Uen/UenField', () => ({
  UenField: () => <div>UEN field</div>,
}))

it.each([FormAuthType.MyInfo, FormAuthType.CP])(
  'shows the full-changes link only on step 2 without an output table for %s',
  (authType) => {
    const attrs = getLoginIdentityAttrsForAuthType(authType)
    const { rerender } = render(
      <ConversionPreview attrs={attrs} stepNumber={0} />,
    )
    expect(screen.getByText('NRIC/FIN field')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    rerender(<ConversionPreview attrs={attrs} stepNumber={1} />)
    expect(
      screen.getByText(
        'If you use webhooks or automations that read FormSG emails, review the full changes and update your automations before switching.',
      ),
    ).toBeInTheDocument()
    const link = screen.getByRole('link', {
      name: 'Check full changes to data',
    })
    expect(link).toHaveAttribute(
      'href',
      'https://guide.form.gov.sg/faq/faq/migration-to-nric-fin-uen-field#will-my-responses-look-different-after-i-convert',
    )
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByText('NRIC/FIN field')).not.toBeInTheDocument()
  },
)
