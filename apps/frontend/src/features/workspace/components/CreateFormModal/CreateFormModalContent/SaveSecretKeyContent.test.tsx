import { PropsWithChildren } from 'react'
import { useForm } from 'react-hook-form'
import { Modal, ModalContent } from '@chakra-ui/react'
import { screen } from '@testing-library/react'

import { isMaskedInReplay, render } from '~/test-utils'

import {
  SaveSecretKeyContent,
  SaveSecretKeyFormInput,
} from './SaveSecretKeyContent'
import { useSaveSecretKey } from './useSaveSecretKey'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  Trans: ({ children }: PropsWithChildren) => children,
}))

const MOCK_SECRET_KEY = 'mock-secret-key-abc123'

const mockUseSaveSecretKey: typeof useSaveSecretKey = () => ({
  isSubmitEnabled: true,
  hasCopiedKey: false,
  handleCopyKey: vi.fn(),
  hasDownloadedKey: false,
  handleDownloadKey: vi.fn(),
  mailToHref: 'mailto:',
})

const TestHarness = () => {
  const { register } = useForm<SaveSecretKeyFormInput>()
  return (
    <Modal isOpen onClose={vi.fn()}>
      <ModalContent>
        <SaveSecretKeyContent
          contentTitle="Save your secret key"
          secretKey={MOCK_SECRET_KEY}
          formTitle="Mock form"
          formId="mock-form-id"
          onClose={vi.fn()}
          isFormStateValid
          handleTrackEmail={vi.fn()}
          onSubmitClick={vi.fn()}
          registerStorageAck={register}
          isLoading={false}
          useSaveSecretKeyHook={mockUseSaveSecretKey}
        />
      </ModalContent>
    </Modal>
  )
}

describe('SaveSecretKeyContent', () => {
  it('masks the displayed secret key in session replays', () => {
    render(<TestHarness />)

    const secretKey = screen.getByText(MOCK_SECRET_KEY)
    expect(isMaskedInReplay(secretKey)).toBe(true)
  })
})
