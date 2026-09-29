import { placeVerifiedFieldsByStep } from '../place-verified-by-step'

const field = (_id: string) => ({ _id })
const ids = (items: { _id: string }[]) => items.map((i) => i._id)

const FIELDS = ['name', 'address', 'income', 'employer', 'remarks'].map(field)

describe('placeVerifiedFieldsByStep', () => {
  it('keeps identities at the end when no step after Step 1 has a login', () => {
    const result = placeVerifiedFieldsByStep({
      fields: FIELDS,
      verified: [
        { stepNumber: 1, field: field('nric1') },
        { field: field('x') },
      ],
      workflow: [{ edit: ['name'] }],
    })

    expect(ids(result)).toEqual([
      'name',
      'address',
      'income',
      'employer',
      'remarks',
      'nric1',
      'x',
    ])
  })

  it('places each identity after the last field its step introduced', () => {
    const result = placeVerifiedFieldsByStep({
      fields: FIELDS,
      verified: [
        { stepNumber: 2, field: field('nric2') },
        { stepNumber: 3, field: field('uen3') },
        { stepNumber: 3, field: field('uid3') },
      ],
      workflow: [
        { edit: ['name', 'address'] },
        { edit: ['income', 'employer'] },
        { edit: ['remarks'] },
      ],
    })

    expect(ids(result)).toEqual([
      'name',
      'address',
      'income',
      'employer',
      'nric2',
      'remarks',
      'uen3',
      'uid3',
    ])
  })

  it('credits a reused field to the first step that edits it', () => {
    const result = placeVerifiedFieldsByStep({
      fields: FIELDS,
      verified: [
        { stepNumber: 1, field: field('nric1') },
        { stepNumber: 2, field: field('nric2') },
      ],
      // Step 2 reuses `address`, which stays with Step 1.
      workflow: [
        { edit: ['name', 'address'] },
        { edit: ['address', 'income'] },
      ],
    })

    expect(ids(result)).toEqual([
      'name',
      'address',
      'nric1',
      'income',
      'nric2',
      'employer',
      'remarks',
    ])
  })

  it('places a step that introduced no field after the previous step block', () => {
    const result = placeVerifiedFieldsByStep({
      fields: FIELDS,
      verified: [
        { stepNumber: 2, field: field('nric2') },
        { stepNumber: 3, field: field('nric3') },
      ],
      workflow: [{ edit: ['name'] }, { edit: ['income'] }, { edit: ['name'] }],
    })

    expect(ids(result)).toEqual([
      'name',
      'address',
      'income',
      'nric2',
      'nric3',
      'employer',
      'remarks',
    ])
  })

  it('puts an identity for a step beyond the saved workflow at the end', () => {
    const result = placeVerifiedFieldsByStep({
      fields: FIELDS,
      verified: [{ stepNumber: 4, field: field('nric4') }],
      workflow: [{ edit: ['name'] }],
    })

    expect(ids(result).slice(-1)).toEqual(['nric4'])
  })
})
