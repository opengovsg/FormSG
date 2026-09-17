import type { FieldResponsesV4 } from '@opengovsg/formsg-sdk'
import { adaptV4ToV3 } from '@opengovsg/formsg-sdk/adapters'
import {
  BasicField,
  FieldResponsesV3,
  FormDto,
  LogicConditionState,
  LogicDto,
  LogicType,
} from 'formsg-shared/types'
import { getVisibleFieldIds } from 'formsg-shared/utils/logic'
import { FieldResponsesV4Input } from 'formsg-shared/utils/v4-answer'
import { fieldResponsesV4ToLogicFieldResponseTransformer } from 'formsg-shared/utils/v4-logic'

import { getVisibleFieldIdsV3 } from '../logic-adaptor'

/**
 * These tests evaluate the differential, since both methods must both
 * have evaluate to the same field visibility given the same input.
 *
 * This is done by asserting equality for:
 * - the MRF middleware evaluates logic by downgrading V4 to V3 and handing the
 * result to `getVisibleFieldIdsV3`.
 * - The shared flatten evaluates the same logic
 * by mapping V4 straight to the evaluator's own input via
 * `fieldResponsesV4ToLogicFieldResponseTransformer`, with no V3 hop.
 */

const ids = Object.fromEntries(
  Object.values(BasicField).map((fieldType, index) => [
    fieldType,
    `00000000000000000000${String(index).padStart(4, '0')}`,
  ]),
) as Record<BasicField, string>

const TABLE_COLUMN_ID = '000000000000000000009001'

const fieldOf = (fieldType: BasicField) => {
  const base = {
    _id: ids[fieldType],
    fieldType,
    title: `${fieldType} question`,
    description: '',
    required: false,
    disabled: false,
  }
  switch (fieldType) {
    case BasicField.Radio:
    case BasicField.Dropdown:
    case BasicField.Checkbox:
      return { ...base, fieldOptions: ['a', 'b'], othersRadioButton: true }
    case BasicField.Table:
      return {
        ...base,
        minimumRows: 1,
        columns: [
          {
            _id: TABLE_COLUMN_ID,
            title: 'col',
            columnType: BasicField.ShortText,
            required: false,
          },
        ],
      }
    default:
      return base
  }
}

/** One field of every type, in `BasicField` declaration order. */
const ALL_FIELDS = Object.values(BasicField).map(
  fieldOf,
) as unknown as FormDto['form_fields']

const answerOf = (fieldType: BasicField): unknown => {
  switch (fieldType) {
    case BasicField.YesNo:
      return { value: 'Yes' }
    case BasicField.Number:
      return { value: '10' }
    case BasicField.Decimal:
      return { value: '2.5' }
    case BasicField.Rating:
      return { value: '4' }
    case BasicField.Dropdown:
      return { value: 'a' }
    case BasicField.Radio:
      return { value: 'a', isOthersInput: false }
    case BasicField.Checkbox:
      return { value: ['a'] }
    case BasicField.Table:
      return {
        row1: { rowNum: 0, value: { [TABLE_COLUMN_ID]: 'a cell' } },
      }
    case BasicField.Address:
      return {
        postalCode: { value: '123456' },
        blockNumber: { value: '1' },
        streetName: { value: 'a street' },
        buildingName: { value: '' },
        levelNumber: { value: '' },
        unitNumber: { value: '' },
      }
    case BasicField.Signature:
      return { value: [], type: 'draw' }
    case BasicField.Attachment:
      return { value: 'a-file.pdf' }
    case BasicField.Children:
      return { child0: { value: { name: { value: 'a child' } } } }
    case BasicField.Email:
    case BasicField.Mobile:
      return { value: 'a@b.com' }
    default:
      return { value: 'an answer' }
  }
}

const answersFor = (
  fieldTypes: BasicField[],
  overrides: Partial<Record<BasicField, unknown>> = {},
): FieldResponsesV4Input =>
  Object.fromEntries(
    fieldTypes.map((fieldType) => [
      ids[fieldType],
      {
        fieldType,
        answer:
          fieldType in overrides ? overrides[fieldType] : answerOf(fieldType),
      },
    ]),
  ) as FieldResponsesV4Input

const ALL_TYPES = Object.values(BasicField)

const showWhen = ({
  _id,
  field,
  state,
  value,
  show,
}: {
  _id: string
  field: BasicField
  state: LogicConditionState
  value: string | string[] | number
  show: BasicField[]
}): LogicDto =>
  ({
    _id,
    logicType: LogicType.ShowFields,
    conditions: [{ field: ids[field], state, value }],
    show: show.map((fieldType) => ids[fieldType]),
  }) as unknown as LogicDto

const sorted = (fieldIds: Set<string>): string[] => [...fieldIds].sort()

const bothPaths = ({
  v4Responses,
  formFields,
  formLogics,
}: {
  v4Responses: FieldResponsesV4Input
  formFields: FormDto['form_fields']
  formLogics: LogicDto[]
}): { viaV3: string[]; viaV4: string[] } => {
  const formProperties = {
    _id: '000000000000000000000000',
    form_fields: formFields,
    form_logics: formLogics,
  } as Pick<FormDto, '_id' | 'form_fields' | 'form_logics'>

  // The middleware's path, verbatim: downgrade to V3, then evaluate.
  const viaV3 = getVisibleFieldIdsV3(
    adaptV4ToV3(
      v4Responses as unknown as FieldResponsesV4,
    ) as unknown as FieldResponsesV3,
    formProperties,
  )._unsafeUnwrap()

  // The flatten's path: V4 straight to the evaluator's input.
  const viaV4 = getVisibleFieldIds(
    fieldResponsesV4ToLogicFieldResponseTransformer(
      v4Responses,
      formFields as never,
    ),
    formProperties,
  )

  return { viaV3: sorted(viaV3), viaV4: sorted(viaV4) }
}

describe('V4 logic-field transformer vs the middleware V3 downgrade', () => {
  it('agrees when every field type is answered and there is no logic', () => {
    const { viaV3, viaV4 } = bothPaths({
      v4Responses: answersFor(ALL_TYPES),
      formFields: ALL_FIELDS,
      formLogics: [],
    })

    expect(viaV4).toEqual(viaV3)
    // Not vacuous: with no logic every field is visible.
    expect(viaV4).toEqual(ALL_TYPES.map((t) => ids[t]).sort())
  })

  /**
   * Every logicable type against every state `LOGIC_MAP` allows for it, in a
   * satisfied and an unsatisfied variant. These are the only types whose answer
   * the evaluator reads, so they are where a transformer difference can change
   * the answer.
   */
  const conditionCases: {
    name: string
    field: BasicField
    state: LogicConditionState
    value: string | string[] | number
    satisfied: boolean
  }[] = [
    {
      name: 'YesNo equal Yes',
      field: BasicField.YesNo,
      state: LogicConditionState.Equal,
      value: 'Yes',
      satisfied: true,
    },
    {
      name: 'YesNo equal No',
      field: BasicField.YesNo,
      state: LogicConditionState.Equal,
      value: 'No',
      satisfied: false,
    },
    {
      name: 'Dropdown equal a',
      field: BasicField.Dropdown,
      state: LogicConditionState.Equal,
      value: 'a',
      satisfied: true,
    },
    {
      name: 'Dropdown equal b',
      field: BasicField.Dropdown,
      state: LogicConditionState.Equal,
      value: 'b',
      satisfied: false,
    },
    {
      name: 'Dropdown either includes a',
      field: BasicField.Dropdown,
      state: LogicConditionState.Either,
      value: ['a', 'b'],
      satisfied: true,
    },
    {
      name: 'Dropdown either excludes a',
      field: BasicField.Dropdown,
      state: LogicConditionState.Either,
      value: ['b'],
      satisfied: false,
    },
    {
      name: 'Radio equal a',
      field: BasicField.Radio,
      state: LogicConditionState.Equal,
      value: 'a',
      satisfied: true,
    },
    {
      name: 'Radio equal b',
      field: BasicField.Radio,
      state: LogicConditionState.Equal,
      value: 'b',
      satisfied: false,
    },
    {
      name: 'Radio either includes a',
      field: BasicField.Radio,
      state: LogicConditionState.Either,
      value: ['a'],
      satisfied: true,
    },
    {
      name: 'Number equal 10',
      field: BasicField.Number,
      state: LogicConditionState.Equal,
      value: '10',
      satisfied: true,
    },
    {
      name: 'Number lte 10',
      field: BasicField.Number,
      state: LogicConditionState.Lte,
      value: 10,
      satisfied: true,
    },
    {
      name: 'Number lte 9',
      field: BasicField.Number,
      state: LogicConditionState.Lte,
      value: 9,
      satisfied: false,
    },
    {
      name: 'Number gte 11',
      field: BasicField.Number,
      state: LogicConditionState.Gte,
      value: 11,
      satisfied: false,
    },
    {
      name: 'Decimal equal 2.5',
      field: BasicField.Decimal,
      state: LogicConditionState.Equal,
      value: '2.5',
      satisfied: true,
    },
    {
      name: 'Decimal gte 2',
      field: BasicField.Decimal,
      state: LogicConditionState.Gte,
      value: 2,
      satisfied: true,
    },
    {
      name: 'Decimal lte 2',
      field: BasicField.Decimal,
      state: LogicConditionState.Lte,
      value: 2,
      satisfied: false,
    },
    {
      name: 'Rating equal 4',
      field: BasicField.Rating,
      state: LogicConditionState.Equal,
      value: '4',
      satisfied: true,
    },
    {
      name: 'Rating gte 5',
      field: BasicField.Rating,
      state: LogicConditionState.Gte,
      value: 5,
      satisfied: false,
    },
  ]

  it.each(conditionCases)(
    'agrees for $name (satisfied: $satisfied)',
    ({ field, state, value, satisfied }) => {
      // The Address is the show target because it is the one field type whose
      // flattened bytes depend on this answer.
      const formLogics = [
        showWhen({
          _id: '000000000000000000009100',
          field,
          state,
          value,
          show: [BasicField.Address],
        }),
      ]
      const { viaV3, viaV4 } = bothPaths({
        v4Responses: answersFor(ALL_TYPES),
        formFields: ALL_FIELDS,
        formLogics,
      })

      expect(viaV4).toEqual(viaV3)
      // Pin the outcome so neither path can agree by both being wrong.
      expect(viaV4.includes(ids[BasicField.Address])).toBe(satisfied)
    },
  )

  /**
   * The Others selection is the one shape the two paths could disagree on: V4
   * carries the free text in `value`, V3 moves it to `othersInput`, and the
   * evaluator matches an `Others` condition only on the latter.
   */
  it.each([
    {
      name: 'an Others free text satisfies an Others condition',
      answer: { value: 'my own reason', isOthersInput: true },
      satisfied: true,
    },
    {
      name: 'a listed option does not',
      answer: { value: 'a', isOthersInput: false },
      satisfied: false,
    },
  ])('agrees when $name', ({ answer, satisfied }) => {
    const { viaV3, viaV4 } = bothPaths({
      v4Responses: answersFor(ALL_TYPES, { [BasicField.Radio]: answer }),
      formFields: ALL_FIELDS,
      formLogics: [
        showWhen({
          _id: '000000000000000000009101',
          field: BasicField.Radio,
          state: LogicConditionState.Equal,
          value: 'Others',
          show: [BasicField.Address],
        }),
      ],
    })

    expect(viaV4).toEqual(viaV3)
    expect(viaV4.includes(ids[BasicField.Address])).toBe(satisfied)
  })

  it('agrees when the condition field has no answer at all', () => {
    const answered = ALL_TYPES.filter((t) => t !== BasicField.YesNo)
    const { viaV3, viaV4 } = bothPaths({
      v4Responses: answersFor(answered),
      formFields: ALL_FIELDS,
      formLogics: [
        showWhen({
          _id: '000000000000000000009102',
          field: BasicField.YesNo,
          state: LogicConditionState.Equal,
          value: 'Yes',
          show: [BasicField.Address],
        }),
      ],
    })

    expect(viaV4).toEqual(viaV3)
    expect(viaV4).not.toContain(ids[BasicField.Address])
  })

  /**
   * An empty-string answer is where the two transformers genuinely differ:
   * the V3 one drops a falsy answer, so the field is absent from the evaluator's
   * input, while the V4 one keeps it with an empty `input`. Both must still
   * reach the same verdict — an absent condition field and an empty one are
   * both unsatisfied.
   */
  it.each([
    { name: 'Equal', state: LogicConditionState.Equal, value: '10' },
    { name: 'Lte', state: LogicConditionState.Lte, value: 10 },
    { name: 'Gte', state: LogicConditionState.Gte, value: 0 },
  ])(
    'agrees on an empty-string Number answer under $name',
    ({ state, value }) => {
      const { viaV3, viaV4 } = bothPaths({
        v4Responses: answersFor(ALL_TYPES, {
          [BasicField.Number]: { value: '' },
        }),
        formFields: ALL_FIELDS,
        formLogics: [
          showWhen({
            _id: '000000000000000000009103',
            field: BasicField.Number,
            state,
            value,
            show: [BasicField.Address],
          }),
        ],
      })

      expect(viaV4).toEqual(viaV3)
      // An empty answer satisfies nothing, including `Gte 0`, which would be
      // satisfied by `Number('')`.
      expect(viaV4).not.toContain(ids[BasicField.Address])
    },
  )

  it('agrees on chained logic, where a condition field is itself hidden', () => {
    // YesNo=Yes shows the Dropdown; the Dropdown then shows the Address. The
    // Dropdown is answered `a`, so the chain resolves only because the
    // Dropdown is visible — the evaluator's fixpoint, which both paths share.
    const formLogics = [
      showWhen({
        _id: '000000000000000000009104',
        field: BasicField.YesNo,
        state: LogicConditionState.Equal,
        value: 'No',
        show: [BasicField.Dropdown],
      }),
      showWhen({
        _id: '000000000000000000009105',
        field: BasicField.Dropdown,
        state: LogicConditionState.Equal,
        value: 'a',
        show: [BasicField.Address],
      }),
    ]
    const { viaV3, viaV4 } = bothPaths({
      v4Responses: answersFor(ALL_TYPES),
      formFields: ALL_FIELDS,
      formLogics,
    })

    expect(viaV4).toEqual(viaV3)
    // YesNo answers `Yes`, so the Dropdown is hidden, so its own condition
    // cannot fire and the Address stays hidden too.
    expect(viaV4).not.toContain(ids[BasicField.Dropdown])
    expect(viaV4).not.toContain(ids[BasicField.Address])
  })

  it('agrees when a PreventSubmit logic unit is present', () => {
    const { viaV3, viaV4 } = bothPaths({
      v4Responses: answersFor(ALL_TYPES),
      formFields: ALL_FIELDS,
      formLogics: [
        {
          _id: '000000000000000000009106',
          logicType: LogicType.PreventSubmit,
          conditions: [
            {
              field: ids[BasicField.YesNo],
              state: LogicConditionState.Equal,
              value: 'Yes',
            },
          ],
          preventSubmitMessage: 'no',
        } as unknown as LogicDto,
      ],
    })

    expect(viaV4).toEqual(viaV3)
    // PreventSubmit hides nothing.
    expect(viaV4).toEqual(ALL_TYPES.map((t) => ids[t]).sort())
  })

  it('agrees when logic references a field that is not in the snapshot', () => {
    const { viaV3, viaV4 } = bothPaths({
      v4Responses: answersFor(ALL_TYPES),
      formFields: ALL_FIELDS,
      formLogics: [
        {
          _id: '000000000000000000009107',
          logicType: LogicType.ShowFields,
          conditions: [
            {
              field: '000000000000000000009999',
              state: LogicConditionState.Equal,
              value: 'Yes',
            },
          ],
          show: [ids[BasicField.Address]],
        } as unknown as LogicDto,
      ],
    })

    expect(viaV4).toEqual(viaV3)
  })

  it('agrees when a V4 response has no matching form field', () => {
    const v4Responses = {
      ...answersFor(ALL_TYPES),
      '000000000000000000009998': {
        fieldType: BasicField.ShortText,
        answer: { value: 'orphan' },
      },
    } as FieldResponsesV4Input

    const { viaV3, viaV4 } = bothPaths({
      v4Responses,
      formFields: ALL_FIELDS,
      formLogics: [
        showWhen({
          _id: '000000000000000000009108',
          field: BasicField.YesNo,
          state: LogicConditionState.Equal,
          value: 'Yes',
          show: [BasicField.Address],
        }),
      ],
    })

    expect(viaV4).toEqual(viaV3)
  })

  /**
   * A logic unit with more than one condition is an AND: the evaluator shows
   * the target only when every condition holds. Every other case here uses a
   * single condition, so this is the only place the AND is exercised.
   */
  it.each([
    { name: 'both conditions hold', yesNo: 'Yes', satisfied: true },
    { name: 'one condition fails', yesNo: 'No', satisfied: false },
  ])('agrees on a two-condition AND when $name', ({ yesNo, satisfied }) => {
    const { viaV3, viaV4 } = bothPaths({
      v4Responses: answersFor(ALL_TYPES, {
        [BasicField.YesNo]: { value: yesNo },
      }),
      formFields: ALL_FIELDS,
      formLogics: [
        {
          _id: '000000000000000000009110',
          logicType: LogicType.ShowFields,
          conditions: [
            {
              field: ids[BasicField.YesNo],
              state: LogicConditionState.Equal,
              value: 'Yes',
            },
            {
              field: ids[BasicField.Dropdown],
              state: LogicConditionState.Equal,
              value: 'a',
            },
          ],
          show: [ids[BasicField.Address]],
        } as unknown as LogicDto,
      ],
    })

    expect(viaV4).toEqual(viaV3)
    expect(viaV4.includes(ids[BasicField.Address])).toBe(satisfied)
  })

  /**
   * Two logic units showing the same field is an OR: either unit alone makes
   * the target visible.
   */
  it.each([
    {
      name: 'neither unit fires',
      yesNo: 'No',
      dropdown: 'b',
      satisfied: false,
    },
    {
      name: 'only the first fires',
      yesNo: 'Yes',
      dropdown: 'b',
      satisfied: true,
    },
    {
      name: 'only the second fires',
      yesNo: 'No',
      dropdown: 'a',
      satisfied: true,
    },
  ])(
    'agrees on two units showing one field when $name',
    ({ yesNo, dropdown, satisfied }) => {
      const { viaV3, viaV4 } = bothPaths({
        v4Responses: answersFor(ALL_TYPES, {
          [BasicField.YesNo]: { value: yesNo },
          [BasicField.Dropdown]: { value: dropdown },
        }),
        formFields: ALL_FIELDS,
        formLogics: [
          showWhen({
            _id: '000000000000000000009111',
            field: BasicField.YesNo,
            state: LogicConditionState.Equal,
            value: 'Yes',
            show: [BasicField.Address],
          }),
          showWhen({
            _id: '000000000000000000009112',
            field: BasicField.Dropdown,
            state: LogicConditionState.Equal,
            value: 'a',
            show: [BasicField.Address],
          }),
        ],
      })

      expect(viaV4).toEqual(viaV3)
      expect(viaV4.includes(ids[BasicField.Address])).toBe(satisfied)
    },
  )

  /** The Others sentinel inside an `Either` list, not only a bare `Equal`. */
  it.each([
    {
      name: 'an Others free text',
      answer: { value: 'my own reason', isOthersInput: true },
      satisfied: true,
    },
    {
      name: 'a listed option in the list',
      answer: { value: 'a', isOthersInput: false },
      satisfied: true,
    },
    {
      name: 'a listed option outside the list',
      answer: { value: 'b', isOthersInput: false },
      satisfied: false,
    },
  ])(
    'agrees on an Either list holding Others, given $name',
    ({ answer, satisfied }) => {
      const { viaV3, viaV4 } = bothPaths({
        v4Responses: answersFor(ALL_TYPES, { [BasicField.Radio]: answer }),
        formFields: ALL_FIELDS,
        formLogics: [
          showWhen({
            _id: '000000000000000000009113',
            field: BasicField.Radio,
            state: LogicConditionState.Either,
            value: ['a', 'Others'],
            show: [BasicField.Address],
          }),
        ],
      })

      expect(viaV4).toEqual(viaV3)
      expect(viaV4.includes(ids[BasicField.Address])).toBe(satisfied)
    },
  )

  /**
   * The evaluator trims both the answer and the condition value, for logic
   * built before the trim existed. Both paths must trim the same way.
   */
  it.each([
    { name: 'the answer has spaces', answer: '  a  ', value: 'a' },
    { name: 'the condition value has spaces', answer: 'a', value: '  a  ' },
    { name: 'both have spaces', answer: ' a ', value: ' a ' },
  ])('agrees on a Dropdown answer when $name', ({ answer, value }) => {
    const { viaV3, viaV4 } = bothPaths({
      v4Responses: answersFor(ALL_TYPES, {
        [BasicField.Dropdown]: { value: answer },
      }),
      formFields: ALL_FIELDS,
      formLogics: [
        showWhen({
          _id: '000000000000000000009114',
          field: BasicField.Dropdown,
          state: LogicConditionState.Equal,
          value,
          show: [BasicField.Address],
        }),
      ],
    })

    expect(viaV4).toEqual(viaV3)
    expect(viaV4).toContain(ids[BasicField.Address])
  })

  /**
   * Each logicable type driving the visibility of every other field type, so no
   * non-logicable type's presence in the evaluator's input can shift the answer
   * in one path and not the other.
   */
  it.each([
    BasicField.YesNo,
    BasicField.Dropdown,
    BasicField.Radio,
    BasicField.Number,
    BasicField.Decimal,
    BasicField.Rating,
  ])('agrees when %s controls every other field type', (field) => {
    const { viaV3, viaV4 } = bothPaths({
      v4Responses: answersFor(ALL_TYPES),
      formFields: ALL_FIELDS,
      formLogics: [
        showWhen({
          _id: '000000000000000000009109',
          field,
          state: LogicConditionState.Equal,
          value: 'nothing matches this',
          show: ALL_TYPES.filter((t) => t !== field),
        }),
      ],
    })

    expect(viaV4).toEqual(viaV3)
    // The condition cannot be met, so only the controlling field stays visible.
    expect(viaV4).toEqual([ids[field]])
  })
})
