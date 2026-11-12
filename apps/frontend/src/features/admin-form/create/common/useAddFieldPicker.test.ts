import { act, renderHook } from '@testing-library/react'

import { useNavigationDraft } from '~features/admin-form/common/navigationSave'

import { useAddFieldPicker } from './useAddFieldPicker'

const mockToast = vi.fn()

vi.mock('react-router', () => ({
  useParams: () => ({ formId: 'form-id' }),
}))
vi.mock('react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock('~hooks/useToast', () => ({
  useToast: () => mockToast,
}))

const BUILDER_URL = `${window.location.origin}/admin/form/form-id?addField=any`

const pickAddField = () => {
  const { result } = renderHook(() => useAddFieldPicker({ label: 'Add' }))
  const [addFieldItem] = result.current.withAddFieldItem([]) as {
    value: string
  }[]
  const onChange = vi.fn()
  act(() => {
    result.current.withAddFieldAction(onChange)(addFieldItem.value)
  })
  return onChange
}

const flush = () =>
  act(async () => {
    await Promise.resolve()
  })

describe('useAddFieldPicker', () => {
  let blankTab: {
    opener: unknown
    location: { href: string }
    close: () => void
  }

  beforeEach(() => {
    blankTab = { opener: window, location: { href: '' }, close: vi.fn() }
    vi.spyOn(window, 'open').mockReturnValue(blankTab as unknown as Window)
  })

  afterEach(() => {
    useNavigationDraft.setState({ draft: null })
    vi.restoreAllMocks()
    mockToast.mockReset()
  })

  it('opens the builder straight away when nothing is unsaved', () => {
    const onChange = pickAddField()

    expect(window.open).toHaveBeenCalledWith(BUILDER_URL, '_blank', 'noopener')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('saves an unsaved step before pointing the new tab at the builder', async () => {
    const save = vi.fn().mockResolvedValue(true)
    useNavigationDraft.setState({
      draft: { owner: Symbol('step'), dirty: true, saving: false, save },
    })

    pickAddField()
    expect(window.open).toHaveBeenCalledWith('', '_blank')
    await flush()

    expect(save).toHaveBeenCalledTimes(1)
    expect(blankTab.opener).toBeNull()
    expect(blankTab.location.href).toBe(BUILDER_URL)
    expect(mockToast).not.toHaveBeenCalled()
  })

  it('closes the new tab and explains when the step fails to save', async () => {
    const save = vi.fn().mockResolvedValue(false)
    useNavigationDraft.setState({
      draft: { owner: Symbol('step'), dirty: true, saving: false, save },
    })

    pickAddField()
    await flush()

    expect(blankTab.close).toHaveBeenCalled()
    expect(blankTab.location.href).toBe('')
    expect(mockToast).toHaveBeenCalledWith({
      description: 'features.adminForm.sidebar.workflow.addField.saveFailed',
    })
  })
})
