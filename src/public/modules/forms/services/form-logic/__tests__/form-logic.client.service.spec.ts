import {
  BasicField,
  IField,
  LogicConditionState,
} from '../../../../../../types'
import * as FormLogic from '../form-logic.client.service'

const VALID_IF_CONDITION_FIELDS = [
  BasicField.Dropdown,
  BasicField.Number,
  BasicField.Decimal,
  BasicField.Rating,
  BasicField.YesNo,
  BasicField.Radio,
]

const INVALID_IF_CONDITION_FIELDS = Object.values(BasicField).filter(
  (fieldType) => !VALID_IF_CONDITION_FIELDS.includes(fieldType),
)
describe('form-logic.client.service', () => {
  describe('getApplicableIfFields', () => {
    it('should not filter fields suitable as an if-conditional', () => {
      const validIfFields: IField[] = VALID_IF_CONDITION_FIELDS.map(
        (fieldType) => ({ fieldType } as unknown as IField),
      )
      const fields = FormLogic.getApplicableIfFields(validIfFields)
      validIfFields.forEach((v, i) => expect(v).toStrictEqual(fields[i]))
    })
    it('should filter fields not suitable as an if-conditional', () => {
      const invalidIfFields: IField[] = INVALID_IF_CONDITION_FIELDS.map(
        (x) => x as unknown as IField,
      )
      const fields = FormLogic.getApplicableIfFields(invalidIfFields)
      expect(fields).toStrictEqual([])
    })
  })

  describe('getApplicableIfStates', () => {
    it('should return valid logic states for categorical field types', () => {
      const categoricalFields = [BasicField.Dropdown, BasicField.Radio]
      categoricalFields.forEach((fieldType) => {
        const states = FormLogic.getApplicableIfStates(fieldType)
        expect(states).toIncludeSameMembers([
          LogicConditionState.Equal,
          LogicConditionState.Either,
        ])
        expect(states).toBeArrayOfSize(2)
      })
    })
    it('should return valid logic states for binary field types', () => {
      const states = FormLogic.getApplicableIfStates(BasicField.YesNo)
      expect(states).toIncludeSameMembers([LogicConditionState.Equal])
      expect(states).toBeArrayOfSize(1)
    })
    it('should return valid logic states for numerical field types', () => {
      const numericalFields = [
        BasicField.Number,
        BasicField.Decimal,
        BasicField.Rating,
      ]
      numericalFields.forEach((fieldType) => {
        const states = FormLogic.getApplicableIfStates(fieldType)
        expect(states).toIncludeSameMembers([
          LogicConditionState.Equal,
          LogicConditionState.Lte,
          LogicConditionState.Gte,
        ])
        expect(states).toBeArrayOfSize(3)
      })
    })
    it('should return empty array for invalid conditional fields', () => {
      INVALID_IF_CONDITION_FIELDS.forEach((fieldType) => {
        const states = FormLogic.getApplicableIfStates(fieldType)
        expect(states).toStrictEqual([])
      })
    })
  })
})
