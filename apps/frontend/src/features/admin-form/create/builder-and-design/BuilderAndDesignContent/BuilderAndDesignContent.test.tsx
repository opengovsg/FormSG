import { BasicField } from 'formsg-shared/types'

import { render } from '~/test-utils'

import {
  FieldBuilderState,
  useFieldBuilderStore,
} from '../useFieldBuilderStore'
import { getFieldCreationMeta } from '../utils/fieldCreation'

import { BuilderAndDesignContent } from './BuilderAndDesignContent'

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
    useFieldBuilderStore.getState().stageFieldCreation(emailField, 3)

    render(<BuilderAndDesignContent placeholderProps={{}} />)

    expect(useFieldBuilderStore.getState().stateData).toEqual({
      state: FieldBuilderState.CreatingField,
      field: emailField,
      insertionIndex: 3,
    })
  })
})
