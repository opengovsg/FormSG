import { ObjectId } from 'bson'

import {
  getApplicableIfStates,
  getLogicUnitPreventingSubmit,
  getVisibleFieldIds,
  LogicFieldClientRadioResponseInput,
  LogicFieldResponse,
  LogicFieldServerResponse,
  RADIO_OTHERS_INPUT_VALUE,
} from '../logic'

import {
  BasicField,
  FormDto,
  FormFieldDto,
  LogicConditionState,
  LogicIfValue,
  LogicType,
  PreventSubmitLogicDto,
  RadioFieldBase,
  ShortTextFieldBase,
  ShowFieldLogicDto,
} from '../../types'

describe('Logic validation', () => {
  /** Mock a field's bare essentials */
  const makeField = (fieldId: string, fieldType: BasicField) =>
    ({ _id: fieldId, fieldType } as FormFieldDto)

  /**
   *  Mock a response
   * @param fieldId field id of the field that this response is meant for
   * @param answer
   * @param answerArray array of answers passed in for checkbox and table
   * @param isVisible whether field is visible
   */
  const makeResponse = (
    fieldId: string,
    fieldType: BasicField,
    answer?: string | number,
  ): LogicFieldServerResponse => {
    return {
      _id: fieldId,
      fieldType,
      answer: String(answer),
    }
  }

  describe('visibility for different states', () => {
    const CONDITION_FIELD_NUMBER = makeField(
      new ObjectId().toHexString(),
      BasicField.Number,
    )
    const CONDITION_FIELD_DROPDOWN = makeField(
      new ObjectId().toHexString(),
      BasicField.Dropdown,
    )
    const LOGIC_FIELD = makeField(
      new ObjectId().toHexString(),
      BasicField.ShortText,
    )
    const LOGIC_RESPONSE = makeResponse(
      LOGIC_FIELD._id,
      BasicField.ShortText,
      'lorem',
    )
    const MOCK_LOGIC_ID = new ObjectId().toHexString()

    let form: FormDto

    beforeEach(() => {
      form = {
        _id: new ObjectId(),
        form_fields: [CONDITION_FIELD_NUMBER, LOGIC_FIELD],
      } as unknown as FormDto
    })

    it('should compute the correct visibility for "is equals to"', () => {
      // Arrange
      const equalsCondition = {
        show: [LOGIC_FIELD._id],
        conditions: [
          {
            ifValueType: LogicIfValue.Number,
            _id: '58169',
            field: CONDITION_FIELD_NUMBER._id,
            state: LogicConditionState.Equal,
            value: 0,
          },
        ],
        _id: MOCK_LOGIC_ID,
        logicType: LogicType.ShowFields,
      } as unknown as ShowFieldLogicDto

      form.form_logics = [equalsCondition]

      // Act + Assert
      expect(
        getVisibleFieldIds(
          [
            makeResponse(
              CONDITION_FIELD_NUMBER._id,
              CONDITION_FIELD_NUMBER.fieldType,
              0,
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ).has(LOGIC_FIELD._id),
      ).toEqual(true)

      expect(
        getVisibleFieldIds(
          [
            makeResponse(
              CONDITION_FIELD_NUMBER._id,
              CONDITION_FIELD_NUMBER.fieldType,
              1,
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ).has(LOGIC_FIELD._id),
      ).toEqual(false)
    })

    it('should compute the correct visibility for "is less than or equal to"', () => {
      // Arrange
      const lteCondition = {
        show: [LOGIC_FIELD._id],
        conditions: [
          {
            ifValueType: LogicIfValue.Number,
            _id: '58169',
            field: CONDITION_FIELD_NUMBER._id,
            state: LogicConditionState.Lte,
            value: 99,
          },
        ],
        _id: MOCK_LOGIC_ID,
        logicType: LogicType.ShowFields,
      } as unknown as ShowFieldLogicDto

      form.form_logics = [lteCondition]

      // Act + Assert
      expect(
        getVisibleFieldIds(
          [
            makeResponse(
              CONDITION_FIELD_NUMBER._id,
              CONDITION_FIELD_NUMBER.fieldType,
              98,
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ).has(LOGIC_FIELD._id),
      ).toEqual(true)

      expect(
        getVisibleFieldIds(
          [
            makeResponse(
              CONDITION_FIELD_NUMBER._id,
              CONDITION_FIELD_NUMBER.fieldType,
              99,
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ).has(LOGIC_FIELD._id),
      ).toEqual(true)

      expect(
        getVisibleFieldIds(
          [
            makeResponse(
              CONDITION_FIELD_NUMBER._id,
              CONDITION_FIELD_NUMBER.fieldType,
              100,
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ).has(LOGIC_FIELD._id),
      ).toEqual(false)
    })

    it('should compute the correct visibility for "is more than or equal to"', () => {
      // Arrange
      const gteCondition = {
        show: [LOGIC_FIELD._id],
        conditions: [
          {
            ifValueType: LogicIfValue.Number,
            _id: '58169',
            field: CONDITION_FIELD_NUMBER._id,
            state: LogicConditionState.Gte,
            value: 22,
          },
        ],
        _id: MOCK_LOGIC_ID,
        logicType: LogicType.ShowFields,
      } as unknown as ShowFieldLogicDto
      form.form_logics = [gteCondition]

      // Act + Assert
      expect(
        getVisibleFieldIds(
          [
            makeResponse(
              CONDITION_FIELD_NUMBER._id,
              CONDITION_FIELD_NUMBER.fieldType,
              23,
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ).has(LOGIC_FIELD._id),
      ).toEqual(true)
      expect(
        getVisibleFieldIds(
          [
            makeResponse(
              CONDITION_FIELD_NUMBER._id,
              CONDITION_FIELD_NUMBER.fieldType,
              22,
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ).has(LOGIC_FIELD._id),
      ).toEqual(true)
      expect(
        getVisibleFieldIds(
          [
            makeResponse(
              CONDITION_FIELD_NUMBER._id,
              CONDITION_FIELD_NUMBER.fieldType,
              21,
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ).has(LOGIC_FIELD._id),
      ).toEqual(false)
    })

    it('should compute the correct visibility for "is either"', () => {
      // Arrange
      const validOptions = ['Option 1', 'Option 2']
      const eitherCondition = {
        show: [LOGIC_FIELD._id],
        conditions: [
          {
            ifValueType: LogicIfValue.MultiSelect,
            _id: '58169',
            field: CONDITION_FIELD_DROPDOWN._id,
            state: LogicConditionState.Either,
            value: validOptions,
          },
        ],
        _id: MOCK_LOGIC_ID,
        logicType: LogicType.ShowFields,
      } as unknown as ShowFieldLogicDto

      // Override the default condition field for this test only
      form.form_fields = [CONDITION_FIELD_DROPDOWN, LOGIC_FIELD]
      form.form_logics = [eitherCondition]

      // Act + Assert
      expect(
        getVisibleFieldIds(
          [
            makeResponse(
              CONDITION_FIELD_DROPDOWN._id,
              CONDITION_FIELD_DROPDOWN.fieldType,
              validOptions[0],
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ).has(LOGIC_FIELD._id),
      ).toEqual(true)

      expect(
        getVisibleFieldIds(
          [
            makeResponse(
              CONDITION_FIELD_DROPDOWN._id,
              CONDITION_FIELD_DROPDOWN.fieldType,
              validOptions[1],
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ).has(LOGIC_FIELD._id),
      ).toEqual(true)

      expect(
        getVisibleFieldIds(
          [
            makeResponse(
              CONDITION_FIELD_DROPDOWN._id,
              CONDITION_FIELD_DROPDOWN.fieldType,
              'invalid option',
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ).has(LOGIC_FIELD._id),
      ).toEqual(false)
    })
  })

  describe('preventing submission for different states', () => {
    const CONDITION_FIELD_NUMBER = makeField(
      new ObjectId().toHexString(),
      BasicField.Number,
    )
    const CONDITION_FIELD_DROPDOWN = makeField(
      new ObjectId().toHexString(),
      BasicField.Dropdown,
    )

    const LOGIC_FIELD = makeField(
      new ObjectId().toHexString(),
      BasicField.ShortText,
    )
    const LOGIC_RESPONSE = makeResponse(
      LOGIC_FIELD._id,
      BasicField.ShortText,
      'lorem',
    )
    const MOCK_LOGIC_ID = new ObjectId().toHexString()

    let form: FormDto

    beforeEach(() => {
      form = {
        _id: new ObjectId(),
        form_fields: [CONDITION_FIELD_NUMBER, LOGIC_FIELD],
      } as unknown as FormDto
    })

    it('should compute that submission should be prevented for "is equals to"', () => {
      // Arrange
      const equalCondition = {
        conditions: [
          {
            ifValueType: LogicIfValue.Number,
            _id: '58169',
            field: CONDITION_FIELD_NUMBER._id,
            state: LogicConditionState.Equal,
            value: 0,
          },
        ],
        _id: MOCK_LOGIC_ID,
        logicType: LogicType.PreventSubmit,
        preventSubmitMessage: "oh no you don't",
      } as unknown as PreventSubmitLogicDto

      form.form_logics = [equalCondition]

      // Act + Assert
      expect(
        getLogicUnitPreventingSubmit(
          [
            makeResponse(
              CONDITION_FIELD_NUMBER._id,
              CONDITION_FIELD_NUMBER.fieldType,
              0,
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ),
      ).toEqual(form.form_logics[0])

      expect(
        getLogicUnitPreventingSubmit(
          [
            makeResponse(
              CONDITION_FIELD_NUMBER._id,
              CONDITION_FIELD_NUMBER.fieldType,
              1,
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ),
      ).toBeUndefined()
    })

    it('should compute that submission should be prevented for "is less than or equal to"', () => {
      // Arrange
      const lteCondition = {
        conditions: [
          {
            ifValueType: LogicIfValue.Number,
            _id: '58169',
            field: CONDITION_FIELD_NUMBER._id,
            state: LogicConditionState.Lte,
            value: 99,
          },
        ],
        _id: MOCK_LOGIC_ID,
        logicType: LogicType.PreventSubmit,
        preventSubmitMessage: "oh no you don't",
      } as unknown as PreventSubmitLogicDto

      form.form_logics = [lteCondition]

      // Act + Assert
      expect(
        getLogicUnitPreventingSubmit(
          [
            makeResponse(
              CONDITION_FIELD_NUMBER._id,
              CONDITION_FIELD_NUMBER.fieldType,
              98,
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ),
      ).toEqual(form.form_logics[0])
      expect(
        getLogicUnitPreventingSubmit(
          [
            makeResponse(
              CONDITION_FIELD_NUMBER._id,
              CONDITION_FIELD_NUMBER.fieldType,
              99,
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ),
      ).toEqual(form.form_logics[0])
      expect(
        getLogicUnitPreventingSubmit(
          [
            makeResponse(
              CONDITION_FIELD_NUMBER._id,
              CONDITION_FIELD_NUMBER.fieldType,
              100,
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ),
      ).toBeUndefined()
    })

    it('should compute that submission should be prevented for "is more than or equal to"', () => {
      // Arrange
      const gteCondition = {
        conditions: [
          {
            ifValueType: LogicIfValue.Number,
            _id: '58169',
            field: CONDITION_FIELD_NUMBER._id,
            state: LogicConditionState.Gte,
            value: 22,
          },
        ],
        _id: MOCK_LOGIC_ID,
        logicType: LogicType.PreventSubmit,
        preventSubmitMessage: "oh no you don't",
      } as unknown as PreventSubmitLogicDto

      form.form_logics = [gteCondition]

      // Act + Assert
      expect(
        getLogicUnitPreventingSubmit(
          [
            makeResponse(
              CONDITION_FIELD_NUMBER._id,
              CONDITION_FIELD_NUMBER.fieldType,
              23,
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ),
      ).toEqual(form.form_logics[0])

      expect(
        getLogicUnitPreventingSubmit(
          [
            makeResponse(
              CONDITION_FIELD_NUMBER._id,
              CONDITION_FIELD_NUMBER.fieldType,
              22,
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ),
      ).toEqual(form.form_logics[0])

      expect(
        getLogicUnitPreventingSubmit(
          [
            makeResponse(
              CONDITION_FIELD_NUMBER._id,
              CONDITION_FIELD_NUMBER.fieldType,
              21,
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ),
      ).toBeUndefined()
    })

    it('should compute that submission should be prevented for "is either"', () => {
      // Arrange
      const validOptions = ['Option 1', 'Option 2']
      const eitherCondition = {
        conditions: [
          {
            ifValueType: LogicIfValue.MultiSelect,
            _id: '58169',
            field: CONDITION_FIELD_DROPDOWN._id,
            state: LogicConditionState.Either,
            value: validOptions,
          },
        ],
        _id: MOCK_LOGIC_ID,
        logicType: LogicType.PreventSubmit,
        preventSubmitMessage: "oh no you don't",
      } as unknown as PreventSubmitLogicDto

      form.form_fields = [CONDITION_FIELD_DROPDOWN, LOGIC_FIELD]
      form.form_logics = [eitherCondition]

      // Act + Assert
      expect(
        getLogicUnitPreventingSubmit(
          [
            makeResponse(
              CONDITION_FIELD_DROPDOWN._id,
              CONDITION_FIELD_DROPDOWN.fieldType,
              validOptions[0],
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ),
      ).toEqual(form.form_logics[0])

      expect(
        getLogicUnitPreventingSubmit(
          [
            makeResponse(
              CONDITION_FIELD_DROPDOWN._id,
              CONDITION_FIELD_DROPDOWN.fieldType,
              validOptions[1],
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ),
      ).toEqual(form.form_logics[0])

      expect(
        getLogicUnitPreventingSubmit(
          [
            makeResponse(
              CONDITION_FIELD_DROPDOWN._id,
              CONDITION_FIELD_DROPDOWN.fieldType,
              'Option 3',
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ),
      ).toBeUndefined()
    })
  })

  describe('show fields with multiple conditions', () => {
    const CONDITION_FIELD_1_YESNO = makeField(
      new ObjectId().toHexString(),
      BasicField.YesNo,
    )
    const CONDITION_FIELD_2_NUMBER = makeField(
      new ObjectId().toHexString(),
      BasicField.Number,
    )
    const LOGIC_FIELD = makeField(
      new ObjectId().toHexString(),
      BasicField.ShortText,
    )
    const LOGIC_RESPONSE = makeResponse(
      LOGIC_FIELD._id,
      BasicField.ShortText,
      'lorem',
    )
    const MOCK_LOGIC_ID_1 = new ObjectId().toHexString()
    const MOCK_LOGIC_ID_2 = new ObjectId().toHexString()

    let form: FormDto

    beforeEach(() => {
      form = {
        _id: new ObjectId(),
        form_fields: [
          CONDITION_FIELD_1_YESNO,
          CONDITION_FIELD_2_NUMBER,
          LOGIC_FIELD,
        ],
      } as unknown as FormDto
    })

    it('should compute the correct visibility for AND conditions', () => {
      // Arrange
      const multipleEqualConditions = {
        show: [LOGIC_FIELD._id],
        _id: MOCK_LOGIC_ID_1,
        conditions: [
          {
            ifValueType: LogicIfValue.SingleSelect,
            _id: '9577',
            field: CONDITION_FIELD_1_YESNO._id,
            state: LogicConditionState.Equal,
            value: 'Yes',
          },
          {
            ifValueType: LogicIfValue.SingleSelect,
            _id: '45633',
            field: CONDITION_FIELD_2_NUMBER._id,
            state: LogicConditionState.Equal,
            value: 20,
          },
        ],
        logicType: LogicType.ShowFields,
      } as unknown as ShowFieldLogicDto

      form.form_logics = [multipleEqualConditions]

      // Act
      expect(
        getVisibleFieldIds(
          [
            makeResponse(
              CONDITION_FIELD_1_YESNO._id,
              CONDITION_FIELD_1_YESNO.fieldType,
              'Yes',
            ),
            makeResponse(
              CONDITION_FIELD_2_NUMBER._id,
              CONDITION_FIELD_2_NUMBER.fieldType,
              20,
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ).has(LOGIC_FIELD._id),
      ).toEqual(true)

      expect(
        getVisibleFieldIds(
          [
            makeResponse(
              CONDITION_FIELD_1_YESNO._id,
              CONDITION_FIELD_1_YESNO.fieldType,
              'Yes',
            ),
            makeResponse(
              CONDITION_FIELD_2_NUMBER._id,
              CONDITION_FIELD_2_NUMBER.fieldType,
              100,
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ).has(LOGIC_FIELD._id),
      ).toEqual(false)

      expect(
        getVisibleFieldIds(
          [
            makeResponse(
              CONDITION_FIELD_1_YESNO._id,
              CONDITION_FIELD_1_YESNO.fieldType,
              'No',
            ),
            makeResponse(
              CONDITION_FIELD_2_NUMBER._id,
              CONDITION_FIELD_2_NUMBER.fieldType,
              20,
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ).has(LOGIC_FIELD._id),
      ).toEqual(false)
    })

    it('should compute the correct visibility for OR conditions', () => {
      // Arrange
      const equalCondition = {
        show: [LOGIC_FIELD._id],
        conditions: [
          {
            ifValueType: LogicIfValue.SingleSelect,
            _id: '9577',
            field: CONDITION_FIELD_1_YESNO._id,
            state: LogicConditionState.Equal,
            value: 'Yes',
          },
        ],
        _id: MOCK_LOGIC_ID_1,
        logicType: LogicType.ShowFields,
      } as unknown as ShowFieldLogicDto

      const equalCondition2 = {
        show: [LOGIC_FIELD._id],
        conditions: [
          {
            ifValueType: LogicIfValue.SingleSelect,
            _id: '89906',
            field: CONDITION_FIELD_2_NUMBER._id,
            state: LogicConditionState.Equal,
            value: 20,
          },
        ],
        _id: MOCK_LOGIC_ID_2,
        logicType: LogicType.ShowFields,
      } as unknown as ShowFieldLogicDto

      form.form_logics = [equalCondition, equalCondition2]

      // Act + Assert
      expect(
        getVisibleFieldIds(
          [
            makeResponse(
              CONDITION_FIELD_1_YESNO._id,
              CONDITION_FIELD_1_YESNO.fieldType,
              'Yes',
            ),
            makeResponse(
              CONDITION_FIELD_2_NUMBER._id,
              CONDITION_FIELD_2_NUMBER.fieldType,
              20,
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ).has(LOGIC_FIELD._id),
      ).toEqual(true)

      expect(
        getVisibleFieldIds(
          [
            makeResponse(
              CONDITION_FIELD_1_YESNO._id,
              CONDITION_FIELD_1_YESNO.fieldType,
              'Yes',
            ),
            makeResponse(
              CONDITION_FIELD_2_NUMBER._id,
              CONDITION_FIELD_2_NUMBER.fieldType,
              100,
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ).has(LOGIC_FIELD._id),
      ).toEqual(true)

      expect(
        getVisibleFieldIds(
          [
            makeResponse(
              CONDITION_FIELD_1_YESNO._id,
              CONDITION_FIELD_1_YESNO.fieldType,
              'No',
            ),
            makeResponse(
              CONDITION_FIELD_2_NUMBER._id,
              CONDITION_FIELD_2_NUMBER.fieldType,
              20,
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ).has(LOGIC_FIELD._id),
      ).toEqual(true)

      expect(
        getVisibleFieldIds(
          [
            makeResponse(
              CONDITION_FIELD_1_YESNO._id,
              CONDITION_FIELD_1_YESNO.fieldType,
              'No',
            ),
            makeResponse(
              CONDITION_FIELD_2_NUMBER._id,
              CONDITION_FIELD_2_NUMBER.fieldType,
              100,
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ).has(LOGIC_FIELD._id),
      ).toEqual(false)
    })
  })

  describe('prevent submit with multiple conditions', () => {
    const CONDITION_FIELD_1_YESNO = makeField(
      new ObjectId().toHexString(),
      BasicField.YesNo,
    )
    const CONDITION_FIELD_2_NUMBER = makeField(
      new ObjectId().toHexString(),
      BasicField.Number,
    )
    const LOGIC_FIELD = makeField(
      new ObjectId().toHexString(),
      BasicField.ShortText,
    )
    const LOGIC_RESPONSE = makeResponse(
      LOGIC_FIELD._id,
      BasicField.ShortText,
      'lorem',
    )
    const MOCK_LOGIC_ID_1 = new ObjectId().toHexString()
    const MOCK_LOGIC_ID_2 = new ObjectId().toHexString()

    let form: FormDto

    beforeEach(() => {
      form = {
        _id: new ObjectId(),
        form_fields: [
          CONDITION_FIELD_1_YESNO,
          CONDITION_FIELD_2_NUMBER,
          LOGIC_FIELD,
        ],
      } as unknown as FormDto
    })

    it('should correctly prevent submission for AND conditions', () => {
      // Arrange
      const multipleEqualConditions = {
        _id: MOCK_LOGIC_ID_1,
        conditions: [
          {
            ifValueType: LogicIfValue.SingleSelect,
            _id: '9577',
            field: CONDITION_FIELD_1_YESNO._id,
            state: LogicConditionState.Equal,
            value: 'Yes',
          },
          {
            ifValueType: LogicIfValue.SingleSelect,
            _id: '45633',
            field: CONDITION_FIELD_2_NUMBER._id,
            state: LogicConditionState.Equal,
            value: 20,
          },
        ],
        logicType: LogicType.PreventSubmit,
        preventSubmitMessage: 'orh hor i tell teacher',
      } as unknown as PreventSubmitLogicDto
      form.form_logics = [multipleEqualConditions]

      // Act + Assert
      expect(
        getLogicUnitPreventingSubmit(
          [
            makeResponse(
              CONDITION_FIELD_1_YESNO._id,
              CONDITION_FIELD_1_YESNO.fieldType,
              'Yes',
            ),
            makeResponse(
              CONDITION_FIELD_2_NUMBER._id,
              CONDITION_FIELD_2_NUMBER.fieldType,
              20,
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ),
      ).toEqual(form.form_logics[0])

      expect(
        getLogicUnitPreventingSubmit(
          [
            makeResponse(
              CONDITION_FIELD_1_YESNO._id,
              CONDITION_FIELD_1_YESNO.fieldType,
              'Yes',
            ),
            makeResponse(
              CONDITION_FIELD_2_NUMBER._id,
              CONDITION_FIELD_2_NUMBER.fieldType,
              100,
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ),
      ).toBeUndefined()

      expect(
        getLogicUnitPreventingSubmit(
          [
            makeResponse(
              CONDITION_FIELD_1_YESNO._id,
              CONDITION_FIELD_1_YESNO.fieldType,
              'No',
            ),
            makeResponse(
              CONDITION_FIELD_2_NUMBER._id,
              CONDITION_FIELD_2_NUMBER.fieldType,
              20,
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ),
      ).toBeUndefined()
    })

    it('should correctly prevent submission for OR conditions', () => {
      // Arrange
      const equalCondition = {
        conditions: [
          {
            ifValueType: LogicIfValue.SingleSelect,
            _id: '9577',
            field: CONDITION_FIELD_1_YESNO._id,
            state: LogicConditionState.Equal,
            value: 'Yes',
          },
        ],
        _id: MOCK_LOGIC_ID_1,
        logicType: LogicType.PreventSubmit,
        preventSubmitMessage: 'this one cannot',
      } as unknown as PreventSubmitLogicDto

      const equalCondition2 = {
        conditions: [
          {
            ifValueType: LogicIfValue.SingleSelect,
            _id: '89906',
            field: CONDITION_FIELD_2_NUMBER._id,
            state: LogicConditionState.Equal,
            value: 20,
          },
        ],
        _id: MOCK_LOGIC_ID_2,
        logicType: LogicType.PreventSubmit,
        preventSubmitMessage: 'this one also cannot',
      } as unknown as PreventSubmitLogicDto

      form.form_logics = [equalCondition, equalCondition2]

      // Act + Assert
      expect(
        getLogicUnitPreventingSubmit(
          [
            makeResponse(
              CONDITION_FIELD_1_YESNO._id,
              CONDITION_FIELD_1_YESNO.fieldType,
              'Yes',
            ),
            makeResponse(
              CONDITION_FIELD_2_NUMBER._id,
              CONDITION_FIELD_2_NUMBER.fieldType,
              20,
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ),
      ).toEqual(form.form_logics[0])

      expect(
        getLogicUnitPreventingSubmit(
          [
            makeResponse(
              CONDITION_FIELD_1_YESNO._id,
              CONDITION_FIELD_1_YESNO.fieldType,
              'Yes',
            ),
            makeResponse(
              CONDITION_FIELD_2_NUMBER._id,
              CONDITION_FIELD_2_NUMBER.fieldType,
              100,
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ),
      ).toEqual(form.form_logics[0])

      expect(
        getLogicUnitPreventingSubmit(
          [
            makeResponse(
              CONDITION_FIELD_1_YESNO._id,
              CONDITION_FIELD_1_YESNO.fieldType,
              'No',
            ),
            makeResponse(
              CONDITION_FIELD_2_NUMBER._id,
              CONDITION_FIELD_2_NUMBER.fieldType,
              20,
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ),
      ).toEqual(form.form_logics[1])

      expect(
        getLogicUnitPreventingSubmit(
          [
            makeResponse(
              CONDITION_FIELD_1_YESNO._id,
              CONDITION_FIELD_1_YESNO.fieldType,
              'No',
            ),
            makeResponse(
              CONDITION_FIELD_2_NUMBER._id,
              CONDITION_FIELD_2_NUMBER.fieldType,
              100,
            ),
            LOGIC_RESPONSE,
          ],
          form,
        ),
      ).toBeUndefined()
    })
  })

  describe('visibility for others value', () => {
    const MOCK_LOGIC_ID = new ObjectId().toHexString()

    const MOCK_RADIO_FIELD = {
      _id: new ObjectId().toHexString(),
      fieldType: BasicField.Radio,
      fieldOptions: ['Option 1', 'Option 2'],
      othersRadioButton: true,
    } as FormFieldDto<RadioFieldBase>

    const MOCK_TEXT_FIELD = {
      _id: new ObjectId().toHexString(),
      fieldType: BasicField.ShortText,
    } as FormFieldDto<ShortTextFieldBase>

    const fillInRadioButton = (input: LogicFieldClientRadioResponseInput) =>
      Object.assign({}, MOCK_RADIO_FIELD, { input, isVisible: true })

    let form: FormDto

    beforeEach(() => {
      form = {
        _id: new ObjectId(),
      } as unknown as FormDto
    })

    it('should compute the correct visibility for radiobutton Others on clientside', () => {
      // Arrange
      const equalCondition = {
        show: [MOCK_TEXT_FIELD._id],
        conditions: [
          {
            ifValueType: LogicIfValue.SingleSelect,
            _id: '58169',
            field: MOCK_RADIO_FIELD._id,
            state: LogicConditionState.Equal,
            value: 'Others',
          },
        ],
        _id: MOCK_LOGIC_ID,
        logicType: LogicType.ShowFields,
      } as unknown as ShowFieldLogicDto

      const textLogicFieldServerResponse = Object.assign({}, MOCK_TEXT_FIELD, {
        fieldValue: 'lorem',
      })
      form.form_fields = [MOCK_RADIO_FIELD, MOCK_TEXT_FIELD]
      form.form_logics = [equalCondition]
      // Act + Assert
      expect(
        getVisibleFieldIds(
          [
            fillInRadioButton({
              value: RADIO_OTHERS_INPUT_VALUE,
              othersInput: 'test',
            }) as unknown as LogicFieldResponse,
            textLogicFieldServerResponse,
          ],
          form,
        ).has(MOCK_TEXT_FIELD._id),
      ).toEqual(true)

      expect(
        getVisibleFieldIds(
          [
            fillInRadioButton({
              value: 'Option 1',
            }) as unknown as LogicFieldResponse,
            textLogicFieldServerResponse,
          ],
          form,
        ).has(MOCK_TEXT_FIELD._id),
      ).toEqual(false)
    })

    it('should compute the correct visibility for radiobutton Others on serverside', () => {
      // Arrange
      const equalCondition = {
        show: [MOCK_TEXT_FIELD._id],
        conditions: [
          {
            ifValueType: LogicIfValue.SingleSelect,
            _id: '58169',
            field: MOCK_RADIO_FIELD._id,
            state: LogicConditionState.Equal,
            value: 'Others',
          },
        ],
        _id: MOCK_LOGIC_ID,
        logicType: LogicType.ShowFields,
      } as unknown as ShowFieldLogicDto

      const textLogicFieldServerResponse = makeResponse(
        new ObjectId().toHexString(),
        BasicField.ShortText,
        'lorem',
      )
      form.form_fields = [MOCK_RADIO_FIELD, MOCK_TEXT_FIELD]
      form.form_logics = [equalCondition]

      // Act + Assert
      expect(
        getVisibleFieldIds(
          [
            makeResponse(
              MOCK_RADIO_FIELD._id,
              MOCK_RADIO_FIELD.fieldType,
              'Others: School',
            ),
            textLogicFieldServerResponse,
          ],
          form,
        ).has(MOCK_TEXT_FIELD._id),
      ).toEqual(true)

      expect(
        getVisibleFieldIds(
          [
            makeResponse(
              MOCK_RADIO_FIELD._id,
              MOCK_RADIO_FIELD.fieldType,
              'Option 1',
            ),
            textLogicFieldServerResponse,
          ],
          form,
        ).has(MOCK_TEXT_FIELD._id),
      ).toEqual(false)
    })
  })

  describe('visibility for circular logic', () => {
    const FIELD_1 = makeField(new ObjectId().toHexString(), BasicField.YesNo)
    const FIELD_2 = makeField(new ObjectId().toHexString(), BasicField.YesNo)
    const VISIBLE_FIELD = makeField(
      new ObjectId().toHexString(),
      BasicField.ShortText,
    )
    const MOCK_LOGIC_ID_1 = new ObjectId()
    const MOCK_LOGIC_ID_2 = new ObjectId()

    let form: FormDto

    beforeEach(() => {
      form = {
        _id: new ObjectId(),
        form_logics: [
          {
            show: [FIELD_2._id],
            conditions: [
              {
                ifValueType: LogicIfValue.SingleSelect,
                _id: '9577',
                field: FIELD_1._id,
                state: LogicConditionState.Equal,
                value: 'Yes',
              },
            ],
            _id: MOCK_LOGIC_ID_1,
            logicType: LogicType.ShowFields,
          } as unknown as ShowFieldLogicDto,
          {
            show: [FIELD_1._id],
            conditions: [
              {
                ifValueType: LogicIfValue.SingleSelect,
                _id: '89906',
                field: FIELD_2._id,
                state: LogicConditionState.Equal,
                value: 'Yes',
              },
            ],
            _id: MOCK_LOGIC_ID_2,
            logicType: LogicType.ShowFields,
          } as unknown as ShowFieldLogicDto,
        ],
      } as unknown as FormDto
    })

    it('should compute the correct visibility for circular logic where all fields are hidden', () => {
      form.form_fields = [FIELD_1, FIELD_2]
      for (const field1Response of ['Yes', 'No']) {
        for (const field2Response of ['Yes', 'No']) {
          const visibleFieldIds = getVisibleFieldIds(
            [
              makeResponse(FIELD_1._id, FIELD_1.fieldType, field1Response),
              makeResponse(FIELD_2._id, FIELD_2.fieldType, field2Response),
            ],
            form,
          )
          expect(visibleFieldIds.has(FIELD_1._id)).toEqual(false)
          expect(visibleFieldIds.has(FIELD_2._id)).toEqual(false)
        }
      }
    })

    it('should compute the correct visibility for circular logic with a mix of shown and hidden fields', () => {
      form.form_fields = [FIELD_1, FIELD_2, VISIBLE_FIELD]
      for (const field1Response of ['Yes', 'No']) {
        for (const field2Response of ['Yes', 'No']) {
          const visibleFieldIds = getVisibleFieldIds(
            [
              makeResponse(FIELD_1._id, FIELD_1.fieldType, field1Response),
              makeResponse(FIELD_2._id, FIELD_2.fieldType, field2Response),
              makeResponse(VISIBLE_FIELD._id, VISIBLE_FIELD.fieldType, 'Yes'),
            ],
            form,
          )
          expect(visibleFieldIds.has(FIELD_1._id)).toEqual(false)
          expect(visibleFieldIds.has(FIELD_2._id)).toEqual(false)
          expect(visibleFieldIds.has(VISIBLE_FIELD._id)).toEqual(true)
        }
      }
    })
  })

  describe('prevent submit for others value', () => {
    const MOCK_LOGIC_ID = new ObjectId()
    const MOCK_RADIO_FIELD = {
      _id: new ObjectId(),
      fieldType: BasicField.Radio,
      fieldOptions: ['Option 1', 'Option 2'],
      othersRadioButton: true,
    } as unknown as FormFieldDto<RadioFieldBase>
    const MOCK_TEXT_FIELD = {
      _id: new ObjectId(),
      fieldType: BasicField.ShortText,
    } as unknown as FormFieldDto<ShortTextFieldBase>

    const fillInRadioButton = (input: LogicFieldClientRadioResponseInput) =>
      Object.assign({}, MOCK_RADIO_FIELD, { input, isVisible: true })

    let form: FormDto

    beforeEach(() => {
      form = { _id: new ObjectId() } as unknown as FormDto
    })

    it('should correctly prevent submission for radiobutton Others on clientside', () => {
      // Arrange
      const textLogicFieldServerResponse = Object.assign({}, MOCK_TEXT_FIELD, {
        fieldValue: 'lorem',
      })
      form.form_fields = [MOCK_RADIO_FIELD, MOCK_TEXT_FIELD]
      form.form_logics = [
        {
          conditions: [
            {
              ifValueType: LogicIfValue.SingleSelect,
              _id: '58169',
              field: MOCK_RADIO_FIELD._id,
              state: LogicConditionState.Equal,
              value: 'Others',
            },
          ],
          _id: MOCK_LOGIC_ID,
          logicType: LogicType.PreventSubmit,
        } as unknown as PreventSubmitLogicDto,
      ]

      // Act + Assert
      expect(
        getLogicUnitPreventingSubmit(
          [
            fillInRadioButton({
              value: RADIO_OTHERS_INPUT_VALUE,
              othersInput: 'test',
            }) as unknown as LogicFieldResponse,
            textLogicFieldServerResponse,
          ],
          form,
        ),
      ).toEqual(form.form_logics[0])

      expect(
        getLogicUnitPreventingSubmit(
          [
            fillInRadioButton({
              value: 'Option 1',
            }) as unknown as LogicFieldResponse,
            textLogicFieldServerResponse,
          ],
          form,
        ),
      ).toBeUndefined()
    })

    it('should correctly prevent submission for radiobutton Others on serverside', () => {
      // Arrange
      const textLogicFieldServerResponse = makeResponse(
        new ObjectId().toHexString(),
        BasicField.ShortText,
        'lorem',
      )
      form.form_fields = [MOCK_RADIO_FIELD, MOCK_TEXT_FIELD]
      form.form_logics = [
        {
          conditions: [
            {
              ifValueType: LogicIfValue.SingleSelect,
              _id: '58169',
              field: MOCK_RADIO_FIELD._id,
              state: LogicConditionState.Equal,
              value: 'Others',
            },
          ],
          _id: MOCK_LOGIC_ID,
          logicType: LogicType.PreventSubmit,
        } as unknown as PreventSubmitLogicDto,
      ]

      // Act + Assert
      expect(
        getLogicUnitPreventingSubmit(
          [
            makeResponse(
              MOCK_RADIO_FIELD._id,
              MOCK_RADIO_FIELD.fieldType,
              'Others: School',
            ),
            textLogicFieldServerResponse,
          ],
          form,
        ),
      ).toEqual(form.form_logics[0])
      expect(
        getLogicUnitPreventingSubmit(
          [
            makeResponse(
              MOCK_RADIO_FIELD._id,
              MOCK_RADIO_FIELD.fieldType,
              'Option 1',
            ),
            textLogicFieldServerResponse,
          ],
          form,
        ),
      ).toBeUndefined()
    })
  })
})

describe('Logic util', () => {
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

  describe('getApplicableIfStates', () => {
    it('should return valid logic states for categorical field types', () => {
      const categoricalFields = [BasicField.Dropdown, BasicField.Radio]
      categoricalFields.forEach((fieldType) => {
        const states = getApplicableIfStates(fieldType)
        expect(states).toContain(LogicConditionState.Equal)
        expect(states).toContain(LogicConditionState.Either)
        expect(states.length).toEqual(2)
      })
    })
    it('should return valid logic states for binary field types', () => {
      const states = getApplicableIfStates(BasicField.YesNo)
      expect(states).toContain(LogicConditionState.Equal)
      expect(states.length).toEqual(1)
    })
    it('should return valid logic states for numerical field types', () => {
      const numericalFields = [
        BasicField.Number,
        BasicField.Decimal,
        BasicField.Rating,
      ]
      numericalFields.forEach((fieldType) => {
        const states = getApplicableIfStates(fieldType)
        expect(states).toContain(LogicConditionState.Equal)
        expect(states).toContain(LogicConditionState.Lte)
        expect(states).toContain(LogicConditionState.Gte)
        expect(states.length).toEqual(3)
      })
    })
    it('should return empty array for invalid conditional fields', () => {
      INVALID_IF_CONDITION_FIELDS.forEach((fieldType) => {
        const states = getApplicableIfStates(fieldType)
        expect(states).toStrictEqual([])
      })
    })
  })
})
