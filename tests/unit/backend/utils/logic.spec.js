const {
  getVisibleFieldIds,
  getLogicUnitPreventingSubmit,
} = require('../../../../dist/backend/shared/util/logic')
describe('Logic validation', () => {
  /**
   * Mock a field
   * @param {String} fieldId
   */
  const makeField = (fieldId) => {
    return { _id: fieldId }
  }
  /**
   *  Mock a response
   * @param {String} fieldId field id of the field that this response is meant for
   * @param {String} answer
   * @param {Array} [answerArray] array of answers passed in for checkbox and table
   * @param {Boolean} [isVisible]
   */
  const makeResponse = (
    fieldId,
    answer,
    answerArray = null,
    isVisible = true,
  ) => {
    let response = { _id: fieldId, answer, isVisible }
    if (answerArray) response.answerArray = answerArray
    return response
  }
  describe('visibility for different states', () => {
    const form = { _id: 'f1' }
    const conditionField = makeField('001')
    const logicField = makeField('002')
    const logicResponse = makeResponse(logicField._id, 'lorem')
    form.form_fields = [conditionField, logicField]
    it('should compute the correct visibility for "is equals to"', () => {
      form.form_logics = [
        {
          show: [logicField._id],
          conditions: [
            {
              ifValueType: 'number',
              _id: '58169',
              field: conditionField._id,
              state: 'is equals to',
              value: 0,
            },
          ],
          _id: '5db00a15af2ffb29487d4eb1',
          logicType: 'showFields',
        },
      ]
      expect(
        getVisibleFieldIds(
          [makeResponse(conditionField._id, 0), logicResponse],
          form,
        ).has(logicField._id),
      ).toBe(true)
      expect(
        getVisibleFieldIds(
          [makeResponse(conditionField._id, 1), logicResponse],
          form,
        ).has(logicField._id),
      ).toBe(false)
    })
    it('should compute the correct visibility for "is less than or equal to"', () => {
      form.form_logics = [
        {
          show: [logicField._id],
          conditions: [
            {
              ifValueType: 'number',
              _id: '58169',
              field: conditionField._id,
              state: 'is less than or equal to',
              value: 99,
            },
          ],
          _id: '5db00a15af2ffb29487d4eb1',
          logicType: 'showFields',
        },
      ]
      expect(
        getVisibleFieldIds(
          [makeResponse(conditionField._id, 98), logicResponse],
          form,
        ).has(logicField._id),
      ).toBe(true)
      expect(
        getVisibleFieldIds(
          [makeResponse(conditionField._id, 99), logicResponse],
          form,
        ).has(logicField._id),
      ).toBe(true)
      expect(
        getVisibleFieldIds(
          [makeResponse(conditionField._id, 100), logicResponse],
          form,
        ).has(logicField._id),
      ).toBe(false)
    })
    it('should compute the correct visibility for "is more than or equal to"', () => {
      form.form_logics = [
        {
          show: [logicField._id],
          conditions: [
            {
              ifValueType: 'number',
              _id: '58169',
              field: conditionField._id,
              state: 'is more than or equal to',
              value: 22,
            },
          ],
          _id: '5db00a15af2ffb29487d4eb1',
          logicType: 'showFields',
        },
      ]
      expect(
        getVisibleFieldIds(
          [makeResponse(conditionField._id, 23), logicResponse],
          form,
        ).has(logicField._id),
      ).toBe(true)
      expect(
        getVisibleFieldIds(
          [makeResponse(conditionField._id, 22), logicResponse],
          form,
        ).has(logicField._id),
      ).toBe(true)
      expect(
        getVisibleFieldIds(
          [makeResponse(conditionField._id, 21), logicResponse],
          form,
        ).has(logicField._id),
      ).toBe(false)
    })
    it('should compute the correct visibility for "is either"', () => {
      form.form_logics = [
        {
          show: [logicField._id],
          conditions: [
            {
              ifValueType: 'multi-select',
              _id: '58169',
              field: conditionField._id,
              state: 'is either',
              value: ['Option 1', 'Option 2'],
            },
          ],
          _id: '5db00a15af2ffb29487d4eb1',
          logicType: 'showFields',
        },
      ]
      expect(
        getVisibleFieldIds(
          [makeResponse(conditionField._id, 'Option 1'), logicResponse],
          form,
        ).has(logicField._id),
      ).toBe(true)
      expect(
        getVisibleFieldIds(
          [makeResponse(conditionField._id, 'Option 2'), logicResponse],
          form,
        ).has(logicField._id),
      ).toBe(true)
      expect(
        getVisibleFieldIds(
          [makeResponse(conditionField._id, 'Option 3'), logicResponse],
          form,
        ).has(logicField._id),
      ).toBe(false)
    })
  })
  describe('preventing submission for different states', () => {
    const form = { _id: 'f1' }
    const conditionField = makeField('001')
    const logicField = makeField('002')
    const logicResponse = makeResponse(logicField._id, 'lorem')
    form.form_fields = [conditionField, logicField]
    it('should compute that submission should be prevented for "is equals to"', () => {
      form.form_logics = [
        {
          show: [],
          conditions: [
            {
              ifValueType: 'number',
              _id: '58169',
              field: conditionField._id,
              state: 'is equals to',
              value: 0,
            },
          ],
          _id: '5db00a15af2ffb29487d4eb1',
          logicType: 'preventSubmit',
        },
      ]
      expect(
        getLogicUnitPreventingSubmit(
          [makeResponse(conditionField._id, 0), logicResponse],
          form,
        ),
      ).toEqual(form.form_logics[0])
      expect(
        getLogicUnitPreventingSubmit(
          [makeResponse(conditionField._id, 1), logicResponse],
          form,
        ),
      ).toBeUndefined()
    })
    it('should compute that submission should be prevented for "is less than or equal to"', () => {
      form.form_logics = [
        {
          show: [],
          conditions: [
            {
              ifValueType: 'number',
              _id: '58169',
              field: conditionField._id,
              state: 'is less than or equal to',
              value: 99,
            },
          ],
          _id: '5db00a15af2ffb29487d4eb1',
          logicType: 'preventSubmit',
        },
      ]
      expect(
        getLogicUnitPreventingSubmit(
          [makeResponse(conditionField._id, 98), logicResponse],
          form,
        ),
      ).toEqual(form.form_logics[0])
      expect(
        getLogicUnitPreventingSubmit(
          [makeResponse(conditionField._id, 99), logicResponse],
          form,
        ),
      ).toEqual(form.form_logics[0])
      expect(
        getLogicUnitPreventingSubmit(
          [makeResponse(conditionField._id, 100), logicResponse],
          form,
        ),
      ).toBeUndefined()
    })
    it('should compute that submission should be prevented for "is more than or equal to"', () => {
      form.form_logics = [
        {
          show: [],
          conditions: [
            {
              ifValueType: 'number',
              _id: '58169',
              field: conditionField._id,
              state: 'is more than or equal to',
              value: 22,
            },
          ],
          _id: '5db00a15af2ffb29487d4eb1',
          logicType: 'preventSubmit',
        },
      ]
      expect(
        getLogicUnitPreventingSubmit(
          [makeResponse(conditionField._id, 23), logicResponse],
          form,
        ),
      ).toEqual(form.form_logics[0])
      expect(
        getLogicUnitPreventingSubmit(
          [makeResponse(conditionField._id, 22), logicResponse],
          form,
        ),
      ).toEqual(form.form_logics[0])
      expect(
        getLogicUnitPreventingSubmit(
          [makeResponse(conditionField._id, 21), logicResponse],
          form,
        ),
      ).toBeUndefined()
    })
    it('should compute that submission should be prevented for "is either"', () => {
      form.form_logics = [
        {
          show: [],
          conditions: [
            {
              ifValueType: 'multi-select',
              _id: '58169',
              field: conditionField._id,
              state: 'is either',
              value: ['Option 1', 'Option 2'],
            },
          ],
          _id: '5db00a15af2ffb29487d4eb1',
          logicType: 'preventSubmit',
        },
      ]
      expect(
        getLogicUnitPreventingSubmit(
          [makeResponse(conditionField._id, 'Option 1'), logicResponse],
          form,
        ),
      ).toEqual(form.form_logics[0])
      expect(
        getLogicUnitPreventingSubmit(
          [makeResponse(conditionField._id, 'Option 2'), logicResponse],
          form,
        ),
      ).toEqual(form.form_logics[0])
      expect(
        getLogicUnitPreventingSubmit(
          [makeResponse(conditionField._id, 'Option 3'), logicResponse],
          form,
        ),
      ).toBeUndefined()
    })
  })
  describe('show fields with multiple conditions', () => {
    const form = { _id: 'f1' }
    const conditionField1 = makeField('001')
    const conditionField2 = makeField('002')
    const logicField = makeField('003')
    const logicResponse = makeResponse(logicField._id, 'lorem')
    form.form_fields = [conditionField1, conditionField2, logicField]
    it('should compute the correct visibility for AND conditions', () => {
      form.form_logics = [
        {
          show: [logicField._id],
          _id: '5df11ee1e6b6e7108a939c8a',
          conditions: [
            {
              ifValueType: 'single-select',
              _id: '9577',
              field: conditionField1._id,
              state: 'is equals to',
              value: 'Yes',
            },
            {
              ifValueType: 'single-select',
              _id: '45633',
              field: conditionField2._id,
              state: 'is equals to',
              value: 20,
            },
          ],
          logicType: 'showFields',
        },
      ]
      expect(
        getVisibleFieldIds(
          [
            makeResponse(conditionField1._id, 'Yes'),
            makeResponse(conditionField2._id, 20),
            logicResponse,
          ],
          form,
        ).has(logicField._id),
      ).toBe(true)
      expect(
        getVisibleFieldIds(
          [
            makeResponse(conditionField1._id, 'Yes'),
            makeResponse(conditionField2._id, 100),
            logicResponse,
          ],
          form,
        ).has(logicField._id),
      ).toBe(false)
      expect(
        getVisibleFieldIds(
          [
            makeResponse(conditionField1._id, 'No'),
            makeResponse(conditionField2._id, 20),
            logicResponse,
          ],
          form,
        ).has(logicField._id),
      ).toBe(false)
    })
    it('should compute the correct visibility for OR conditions', () => {
      form.form_logics = [
        {
          show: [logicField._id],
          conditions: [
            {
              ifValueType: 'single-select',
              _id: '9577',
              field: conditionField1._id,
              state: 'is equals to',
              value: 'Yes',
            },
          ],
          _id: '5df11ee1e6b6e7108a939c8a',
          logicType: 'showFields',
        },
        {
          show: [logicField._id],
          conditions: [
            {
              ifValueType: 'single-select',
              _id: '89906',
              field: conditionField2._id,
              state: 'is equals to',
              value: 20,
            },
          ],
          _id: '5df127a2e6b6e7108a939c90',
          logicType: 'showFields',
        },
      ]
      expect(
        getVisibleFieldIds(
          [
            makeResponse(conditionField1._id, 'Yes'),
            makeResponse(conditionField2._id, 20),
            logicResponse,
          ],
          form,
        ).has(logicField._id),
      ).toBe(true)
      expect(
        getVisibleFieldIds(
          [
            makeResponse(conditionField1._id, 'Yes'),
            makeResponse(conditionField2._id, 100),
            logicResponse,
          ],
          form,
        ).has(logicField._id),
      ).toBe(true)
      expect(
        getVisibleFieldIds(
          [
            makeResponse(conditionField1._id, 'No'),
            makeResponse(conditionField2._id, 20),
            logicResponse,
          ],
          form,
        ).has(logicField._id),
      ).toBe(true)
      expect(
        getVisibleFieldIds(
          [
            makeResponse(conditionField1._id, 'No'),
            makeResponse(conditionField2._id, 100),
            logicResponse,
          ],
          form,
        ).has(logicField._id),
      ).toBe(false)
    })
  })
  describe('prevent submit with multiple conditions', () => {
    const form = { _id: 'f1' }
    const conditionField1 = makeField('001')
    const conditionField2 = makeField('002')
    const logicField = makeField('003')
    const logicResponse = makeResponse(logicField._id, 'lorem')
    form.form_fields = [conditionField1, conditionField2, logicField]
    it('should correctly prevent submission for AND conditions', () => {
      form.form_logics = [
        {
          show: [],
          _id: '5df11ee1e6b6e7108a939c8a',
          conditions: [
            {
              ifValueType: 'single-select',
              _id: '9577',
              field: conditionField1._id,
              state: 'is equals to',
              value: 'Yes',
            },
            {
              ifValueType: 'single-select',
              _id: '45633',
              field: conditionField2._id,
              state: 'is equals to',
              value: 20,
            },
          ],
          logicType: 'preventSubmit',
        },
      ]
      expect(
        getLogicUnitPreventingSubmit(
          [
            makeResponse(conditionField1._id, 'Yes'),
            makeResponse(conditionField2._id, 20),
            logicResponse,
          ],
          form,
        ),
      ).toEqual(form.form_logics[0])
      expect(
        getLogicUnitPreventingSubmit(
          [
            makeResponse(conditionField1._id, 'Yes'),
            makeResponse(conditionField2._id, 100),
            logicResponse,
          ],
          form,
        ),
      ).toBeUndefined()
      expect(
        getLogicUnitPreventingSubmit(
          [
            makeResponse(conditionField1._id, 'No'),
            makeResponse(conditionField2._id, 20),
            logicResponse,
          ],
          form,
        ),
      ).toBeUndefined()
    })
    it('should correctly prevent submission for OR conditions', () => {
      form.form_logics = [
        {
          show: [],
          conditions: [
            {
              ifValueType: 'single-select',
              _id: '9577',
              field: conditionField1._id,
              state: 'is equals to',
              value: 'Yes',
            },
          ],
          _id: '5df11ee1e6b6e7108a939c8a',
          logicType: 'preventSubmit',
        },
        {
          show: [],
          conditions: [
            {
              ifValueType: 'single-select',
              _id: '89906',
              field: conditionField2._id,
              state: 'is equals to',
              value: 20,
            },
          ],
          _id: '5df127a2e6b6e7108a939c90',
          logicType: 'preventSubmit',
        },
      ]
      expect(
        getLogicUnitPreventingSubmit(
          [
            makeResponse(conditionField1._id, 'Yes'),
            makeResponse(conditionField2._id, 20),
            logicResponse,
          ],
          form,
        ),
      ).toEqual(form.form_logics[0])
      expect(
        getLogicUnitPreventingSubmit(
          [
            makeResponse(conditionField1._id, 'Yes'),
            makeResponse(conditionField2._id, 100),
            logicResponse,
          ],
          form,
        ),
      ).toEqual(form.form_logics[0])
      expect(
        getLogicUnitPreventingSubmit(
          [
            makeResponse(conditionField1._id, 'No'),
            makeResponse(conditionField2._id, 20),
            logicResponse,
          ],
          form,
        ),
      ).toEqual(form.form_logics[1])
      expect(
        getLogicUnitPreventingSubmit(
          [
            makeResponse(conditionField1._id, 'No'),
            makeResponse(conditionField2._id, 100),
            logicResponse,
          ],
          form,
        ),
      ).toBeUndefined()
    })
  })
  describe('visibility for others value', () => {
    const form = { _id: 'f1' }
    const radioButton = {
      _id: '001',
      fieldType: 'radiobutton',
      fieldOptions: ['Option 1', 'Option 2'],
      othersRadioButton: true,
    }
    const textField = { _id: '002', fieldType: 'textfield' }
    it('should compute the correct visibility for radiobutton Others on clientside', () => {
      const textFieldResponse = Object.assign({}, textField, {
        fieldValue: 'lorem',
      })
      form.form_fields = [radioButton, textField]
      form.form_logics = [
        {
          show: [textField._id],
          conditions: [
            {
              ifValueType: 'single-select',
              _id: '58169',
              field: radioButton._id,
              state: 'is equals to',
              value: 'Others',
            },
          ],
          _id: '5db00a15af2ffb29487d4eb1',
          logicType: 'showFields',
        },
      ]
      const fillInRadioButton = (fieldValue) =>
        Object.assign({}, radioButton, { fieldValue, isVisible: true })
      expect(
        getVisibleFieldIds(
          [fillInRadioButton('radioButtonOthers'), textFieldResponse],
          form,
        ).has(textField._id),
      ).toBe(true)
      expect(
        getVisibleFieldIds(
          [fillInRadioButton('Option 1'), textFieldResponse],
          form,
        ).has(textField._id),
      ).toBe(false)
    })
    it('should compute the correct visibility for radiobutton Others on serverside', () => {
      const textFieldResponse = makeResponse('002', 'lorem')
      form.form_fields = [radioButton, textField]
      form.form_logics = [
        {
          show: [textField._id],
          conditions: [
            {
              ifValueType: 'single-select',
              _id: '58169',
              field: radioButton._id,
              state: 'is equals to',
              value: 'Others',
            },
          ],
          _id: '5db00a15af2ffb29487d4eb1',
          logicType: 'showFields',
        },
      ]
      expect(
        getVisibleFieldIds(
          [makeResponse(radioButton._id, 'Others: School'), textFieldResponse],
          form,
        ).has(textField._id),
      ).toBe(true)
      expect(
        getVisibleFieldIds(
          [makeResponse(radioButton._id, 'Option 1'), textFieldResponse],
          form,
        ).has(textField._id),
      ).toBe(false)
    })
  })
  describe('visibility for circular logic', () => {
    const form = { _id: 'f1' }
    const field1 = makeField('001')
    const field2 = makeField('002')
    const visibleField = makeField('003')
    form.form_logics = [
      {
        show: [field2._id],
        conditions: [
          {
            ifValueType: 'single-select',
            _id: '9577',
            field: field1._id,
            state: 'is equals to',
            value: 'Yes',
          },
        ],
        _id: '5df11ee1e6b6e7108a939c8a',
        logicType: 'showFields',
      },
      {
        show: [field1._id],
        conditions: [
          {
            ifValueType: 'single-select',
            _id: '89906',
            field: field2._id,
            state: 'is equals to',
            value: 'Yes',
          },
        ],
        _id: '5df127a2e6b6e7108a939c90',
        logicType: 'showFields',
      },
    ]
    it('should compute the correct visibility for circular logic where all fields are hidden', () => {
      form.form_fields = [field1, field2]
      for (let field1Response of ['Yes', 'No']) {
        for (let field2Response of ['Yes', 'No']) {
          const visibleFieldIds = getVisibleFieldIds(
            [
              makeResponse(field1._id, field1Response),
              makeResponse(field2._id, field2Response),
            ],
            form,
          )
          expect(visibleFieldIds.has(field1._id)).toBe(false)
          expect(visibleFieldIds.has(field2._id)).toBe(false)
        }
      }
    })
    it('should compute the correct visibility for circular logic with a mix of shown and hidden fields', () => {
      form.form_fields = [field1, field2, visibleField]
      for (let field1Response of ['Yes', 'No']) {
        for (let field2Response of ['Yes', 'No']) {
          const visibleFieldIds = getVisibleFieldIds(
            [
              makeResponse(field1._id, field1Response),
              makeResponse(field2._id, field2Response),
              makeResponse(visibleField._id, 'Yes'),
            ],
            form,
          )
          expect(visibleFieldIds.has(field1._id)).toBe(false)
          expect(visibleFieldIds.has(field2._id)).toBe(false)
          expect(visibleFieldIds.has(visibleField._id)).toBe(true)
        }
      }
    })
  })
  describe('prevent submit for others value', () => {
    const form = { _id: 'f1' }
    const radioButton = {
      _id: '001',
      fieldType: 'radiobutton',
      fieldOptions: ['Option 1', 'Option 2'],
      othersRadioButton: true,
    }
    const textField = { _id: '002', fieldType: 'textfield' }
    it('should correctly prevent submission for radiobutton Others on clientside', () => {
      const textFieldResponse = Object.assign({}, textField, {
        fieldValue: 'lorem',
      })
      form.form_fields = [radioButton, textField]
      form.form_logics = [
        {
          show: [],
          conditions: [
            {
              ifValueType: 'single-select',
              _id: '58169',
              field: radioButton._id,
              state: 'is equals to',
              value: 'Others',
            },
          ],
          _id: '5db00a15af2ffb29487d4eb1',
          logicType: 'preventSubmit',
        },
      ]
      const fillInRadioButton = (fieldValue) =>
        Object.assign({}, radioButton, { fieldValue, isVisible: true })
      expect(
        getLogicUnitPreventingSubmit(
          [fillInRadioButton('radioButtonOthers'), textFieldResponse],
          form,
        ),
      ).toEqual(form.form_logics[0])
      expect(
        getLogicUnitPreventingSubmit(
          [fillInRadioButton('Option 1'), textFieldResponse],
          form,
        ),
      ).toBeUndefined()
    })
    it('should correctly prevent submission for radiobutton Others on serverside', () => {
      const textFieldResponse = makeResponse('002', 'lorem')
      form.form_fields = [radioButton, textField]
      form.form_logics = [
        {
          show: [],
          conditions: [
            {
              ifValueType: 'single-select',
              _id: '58169',
              field: radioButton._id,
              state: 'is equals to',
              value: 'Others',
            },
          ],
          _id: '5db00a15af2ffb29487d4eb1',
          logicType: 'preventSubmit',
        },
      ]
      expect(
        getLogicUnitPreventingSubmit(
          [makeResponse(radioButton._id, 'Others: School'), textFieldResponse],
          form,
        ),
      ).toEqual(form.form_logics[0])
      expect(
        getLogicUnitPreventingSubmit(
          [makeResponse(radioButton._id, 'Option 1'), textFieldResponse],
          form,
        ),
      ).toBeUndefined()
    })
  })
})
