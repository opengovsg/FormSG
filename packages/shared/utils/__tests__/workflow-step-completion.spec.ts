import { ObjectId } from 'bson'

import {
  getIncompleteStepNumbers,
  isStepComplete,
} from '../workflow-step-completion'

import {
  BasicField,
  FormFieldDto,
  FormWorkflowStep,
  WorkflowType,
} from '../../types'

describe('isStepComplete', () => {
  const FIELD_ID = 'field-1'
  const OTHER_FIELD_ID = 'field-2'
  const DROPDOWN_ID = 'dropdown-1'

  /** Mock a field's bare essentials */
  const makeField = (fieldId: string, fieldType: BasicField) =>
    ({ _id: fieldId, fieldType }) as FormFieldDto

  const makeDropdown = (
    fieldOptions: string[],
    optionsToRecipientsMap?: Record<string, string[]>,
  ) =>
    ({
      _id: DROPDOWN_ID,
      fieldType: BasicField.Dropdown,
      fieldOptions,
      optionsToRecipientsMap,
    }) as unknown as FormFieldDto

  const staticStep = (overrides: Partial<FormWorkflowStep> = {}) =>
    ({
      workflow_type: WorkflowType.Static,
      edit: [FIELD_ID],
      emails: ['someone@example.com'],
      ...overrides,
    }) as FormWorkflowStep

  const formFields = [makeField(FIELD_ID, BasicField.YesNo)]

  describe('fields to fill', () => {
    it('should return false when the step has no fields, on any step', () => {
      expect(isStepComplete(staticStep({ edit: [] }), formFields, 1)).toBe(
        false,
      )
    })

    // P20: the check that distinguishes the pinned ordering from the reordered
    // one. Step 0 is exempt from needing a person, never from needing fields.
    it('should return false when step 0 has no fields', () => {
      expect(
        isStepComplete(staticStep({ edit: [], emails: [] }), formFields, 0),
      ).toBe(false)
    })
  })

  describe('step 0', () => {
    it('should return true when step 0 has fields but no recipients', () => {
      expect(isStepComplete(staticStep({ emails: [] }), formFields, 0)).toBe(
        true,
      )
    })
  })

  describe('static respondents', () => {
    it('should return false when there are no recipients', () => {
      expect(isStepComplete(staticStep({ emails: [] }), formFields, 1)).toBe(
        false,
      )
    })

    it('should return true when there is a recipient', () => {
      expect(isStepComplete(staticStep(), formFields, 1)).toBe(true)
    })
  })

  describe('dynamic respondents', () => {
    const dynamicStep = (field?: string) =>
      ({
        workflow_type: WorkflowType.Dynamic,
        edit: [FIELD_ID],
        field,
      }) as unknown as FormWorkflowStep

    it('should return false when no field is chosen', () => {
      expect(isStepComplete(dynamicStep(undefined), formFields, 1)).toBe(false)
    })

    it('should return true when a field is chosen', () => {
      expect(isStepComplete(dynamicStep(OTHER_FIELD_ID), formFields, 1)).toBe(
        true,
      )
    })
  })

  describe('conditional routing', () => {
    const conditionalStep = (conditionalField?: string) =>
      ({
        workflow_type: WorkflowType.Conditional,
        edit: [FIELD_ID],
        conditional_field: conditionalField,
      }) as unknown as FormWorkflowStep

    it('should return false when no dropdown is chosen', () => {
      expect(isStepComplete(conditionalStep(undefined), formFields, 1)).toBe(
        false,
      )
    })

    it('should return false when the chosen field no longer exists', () => {
      expect(isStepComplete(conditionalStep(DROPDOWN_ID), formFields, 1)).toBe(
        false,
      )
    })

    it('should return false when the chosen field is not a dropdown', () => {
      const fields = [...formFields, makeField(DROPDOWN_ID, BasicField.YesNo)]
      expect(isStepComplete(conditionalStep(DROPDOWN_ID), fields, 1)).toBe(
        false,
      )
    })

    it('should return false when an option has no recipients', () => {
      const fields = [
        ...formFields,
        makeDropdown(['a', 'b'], { a: ['someone@example.com'], b: [] }),
      ]
      expect(isStepComplete(conditionalStep(DROPDOWN_ID), fields, 1)).toBe(
        false,
      )
    })

    it('should return false when an option is missing from the map', () => {
      const fields = [
        ...formFields,
        makeDropdown(['a', 'b'], { a: ['someone@example.com'] }),
      ]
      expect(isStepComplete(conditionalStep(DROPDOWN_ID), fields, 1)).toBe(
        false,
      )
    })

    it('should return false when there is no map at all', () => {
      const fields = [...formFields, makeDropdown(['a', 'b'])]
      expect(isStepComplete(conditionalStep(DROPDOWN_ID), fields, 1)).toBe(
        false,
      )
    })

    it('should return true when every option has a recipient', () => {
      const fields = [
        ...formFields,
        makeDropdown(['a', 'b'], {
          a: ['someone@example.com'],
          b: ['someone-else@example.com'],
        }),
      ]
      expect(isStepComplete(conditionalStep(DROPDOWN_ID), fields, 1)).toBe(true)
    })
  })

  // P19
  describe('approval fields', () => {
    it('should return false when the approval field is not one the person fills in', () => {
      expect(
        isStepComplete(
          staticStep({ edit: [FIELD_ID], approval_field: OTHER_FIELD_ID }),
          formFields,
          1,
        ),
      ).toBe(false)
    })

    it('should return true when the approval field is one the person fills in', () => {
      expect(
        isStepComplete(
          staticStep({ edit: [FIELD_ID], approval_field: FIELD_ID }),
          formFields,
          1,
        ),
      ).toBe(true)
    })

    it('should not affect steps without an approval field', () => {
      expect(isStepComplete(staticStep(), formFields, 1)).toBe(true)
    })

    it('should apply to step 0 as well', () => {
      expect(
        isStepComplete(
          staticStep({
            edit: [FIELD_ID],
            emails: [],
            approval_field: OTHER_FIELD_ID,
          }),
          formFields,
          0,
        ),
      ).toBe(false)
    })
  })

  // The backend passes Mongoose ObjectIds, not strings. `===` and `includes`
  // compare object identity, so every id comparison must go through String().
  describe('object ids', () => {
    const objectId = (hex: string) => new ObjectId(hex)
    const EDIT_HEX = '6a7de1810000000000000001'
    const DROPDOWN_HEX = '6a7de1810000000000000002'

    it('should match an approval field given as an ObjectId', () => {
      const step = {
        workflow_type: WorkflowType.Static,
        edit: [objectId(EDIT_HEX)],
        emails: ['someone@example.com'],
        approval_field: objectId(EDIT_HEX),
      } as unknown as FormWorkflowStep

      expect(isStepComplete(step, [], 1)).toBe(true)
    })

    it('should match a conditional field given as an ObjectId', () => {
      const step = {
        workflow_type: WorkflowType.Conditional,
        edit: [objectId(EDIT_HEX)],
        conditional_field: objectId(DROPDOWN_HEX),
      } as unknown as FormWorkflowStep
      const fields = [
        {
          _id: objectId(DROPDOWN_HEX),
          fieldType: BasicField.Dropdown,
          fieldOptions: ['a'],
          optionsToRecipientsMap: { a: ['someone@example.com'] },
        },
      ] as unknown as FormFieldDto[]

      expect(isStepComplete(step, fields, 1)).toBe(true)
    })
  })

  describe('getIncompleteStepNumbers', () => {
    it('should return the indices of incomplete steps only', () => {
      const workflow = [
        staticStep({ emails: [] }), // step 0, has fields, exempt
        staticStep(), // complete
        staticStep({ emails: [] }), // incomplete, no recipient
        staticStep({ edit: [] }), // incomplete, no fields
      ]
      expect(getIncompleteStepNumbers(workflow, formFields)).toEqual([2, 3])
    })

    it('should return an empty array when every step is complete', () => {
      expect(
        getIncompleteStepNumbers([staticStep(), staticStep()], formFields),
      ).toEqual([])
    })
  })
})
