import {
  BasicField,
  IFieldSchema,
  LogicCheckboxCondition,
} from '../../../../../../types'
import {
  ClientCheckboxCondition,
  convertArrayCheckboxCondition,
  convertObjectCheckboxCondition,
} from '../form-logic-checkbox.client.service'

describe('convertObjectCheckboxCondition', () => {
  describe('condition value with object representation', () => {
    const OPTIONS = ['Option 1', 'Option 2', 'Option 3']
    it('should correctly convert condition value with others true into array representation', () => {
      // Arrange
      const conditionWithObjectRepresentation = {
        value: [
          {
            options: [OPTIONS[0], OPTIONS[2]],
            others: true,
          },
        ],
      } as unknown as LogicCheckboxCondition // only care about the value portion of the condition
      const expected = {
        value: [[OPTIONS[0], OPTIONS[2], 'Others']],
      }

      // Act
      const transformed = convertObjectCheckboxCondition(
        conditionWithObjectRepresentation,
      )

      // Assert
      expect(transformed).toEqual(expected)
    })
    it('should correctly convert condition value with others false into array representation', () => {
      // Arrange
      const conditionWithObjectRepresentation = {
        value: [
          {
            options: [OPTIONS[0], OPTIONS[2]],
            others: false,
          },
        ],
      } as unknown as LogicCheckboxCondition // only care about the value portion of the condition
      const expected = {
        value: [[OPTIONS[0], OPTIONS[2]]],
      }

      // Act
      const transformed = convertObjectCheckboxCondition(
        conditionWithObjectRepresentation,
      )

      // Assert
      expect(transformed).toEqual(expected)
    })
  })
  describe('condition value with array representation', () => {
    const OPTIONS = ['Option 1', 'Option 2', 'Option 3']
    it('should correctly convert condition value with others string and othersRadioButton true into object representation', () => {
      // Arrange
      const field = {
        fieldType: BasicField.Checkbox,
        fieldOptions: OPTIONS,
        othersRadioButton: true,
      } as unknown as IFieldSchema
      const conditionWithArrayRepresentation = {
        value: [[OPTIONS[0], OPTIONS[2], 'Others']],
      } as unknown as ClientCheckboxCondition // only care about the value portion of the condition

      const expected = {
        value: [
          {
            options: [OPTIONS[0], OPTIONS[2]],
            others: true,
          },
        ],
      }

      // Act
      const transformed = convertArrayCheckboxCondition(
        conditionWithArrayRepresentation,
        field,
      )

      // Assert
      expect(transformed).toEqual(expected)
    })
    it('should correctly convert condition value with othersRadioButton false into object representation', () => {
      // Arrange
      const field = {
        fieldType: BasicField.Checkbox,
        fieldOptions: OPTIONS,
        othersRadioButton: false,
      } as unknown as IFieldSchema
      const conditionWithArrayRepresentation = {
        value: [[OPTIONS[0], OPTIONS[2]]],
      } as unknown as ClientCheckboxCondition // only care about the value portion of the condition

      const expected = {
        value: [
          {
            options: [OPTIONS[0], OPTIONS[2]],
            others: false,
          },
        ],
      }

      // Act
      const transformed = convertArrayCheckboxCondition(
        conditionWithArrayRepresentation,
        field,
      )

      // Assert
      expect(transformed).toEqual(expected)
    })
  })
})
