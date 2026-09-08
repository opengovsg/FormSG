import { BasicField } from 'formsg-shared/types'

import { render } from '~/test-utils'

import {
  FieldBuilderState,
  useFieldBuilderStore,
} from '../useFieldBuilderStore'
import { getFieldCreationMeta } from '../utils/fieldCreation'

import { BuilderAndDesignContent } from './BuilderAndDesignContent'

// The form builder itself is beside the point here; this file is only about
// what the two mount effects do to the field builder store.
vi.mock('./FormBuilder', () => ({ FormBuilder: () => null }))

vi.mock('~features/admin-form/settings/queries', () => ({
  useAdminFormSettings: () => ({ data: undefined }),
}))

const emailField = getFieldCreationMeta(BasicField.Email)

beforeEach(() =>
  useFieldBuilderStore.setState({
    stateData: { state: FieldBuilderState.Inactive },
    holdingStateData: null,
    pendingFieldCreation: null,
  }),
)

describe('BuilderAndDesignContent', () => {
  it('opens on a field staged before it mounted', () => {
    // The mount reset and the consume are separate effects, and only their
    // declaration order stops the reset from wiping the staged field on the
    // way in. Swap the two effects and this is the check that notices.
    useFieldBuilderStore.getState().stageFieldCreation(emailField, 3)

    render(<BuilderAndDesignContent placeholderProps={{}} />)

    expect(useFieldBuilderStore.getState().stateData).toEqual({
      state: FieldBuilderState.CreatingField,
      field: emailField,
      insertionIndex: 3,
    })
  })
})
