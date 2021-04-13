import { cloneDeep } from 'lodash'

import { stringifySafe } from 'src/shared/util/stringify-safe'

// Tests that the stringifySafe function works as expected, i.e. correctly
// deals with circular references and BigInt.
describe('Safe stringify function', () => {
  let json: Record<string, any>, expected: Record<string, any>
  beforeEach(() => {
    json = {
      complicated: {
        nested: {
          jsons: 'should be stringified',
        },
      },
      correctly: 'by',
      the: ['safe', ' stringify', { function: ',' }],
      including: {
        deeply: [],
        nested: 'references.',
      },
      functions: () => 'should be ignored like in JSON.stringify.',
    }
    expected = cloneDeep(json)
  })
  it('should be the same as JSON.stringify for regular JSONs', () => {
    expect(stringifySafe(json)).toEqual(JSON.stringify(json))
  })
  it('should correctly deal with single-nested circular references', () => {
    expected.circular = '[Circular ~]'
    json.circular = json
    expect(stringifySafe(json)).toEqual(JSON.stringify(expected))
  })
  it('should correctly deal with deeply nested circular references', () => {
    // Add one shallow reference: json.circular = json
    // And two deeper ones: json.including.deeply[0] = json.including
    // and json.including.deeply[1] = json
    expected.circular = '[Circular ~]'
    expected.including.deeply.push('[Circular ~.including]')
    expected.including.deeply.push('[Circular ~]')

    json.circular = json
    json.including.deeply.push(json.including)
    json.including.deeply.push(json)

    expect(stringifySafe(json)).toEqual(JSON.stringify(expected))
  })
  it('should convert BigInt of < Number.MAX_SAFE_INTEGER to string', () => {
    expected.bigInt = '10'
    json.bigInt = BigInt(10)
    expect(stringifySafe(json)).toEqual(JSON.stringify(expected))
  })

  it('should convert BigInt of > Number.MAX_SAFE_INTEGER to string', () => {
    expected.bigInt = '9007199254740995'
    json.bigInt = BigInt('9007199254740995')
    expect(stringifySafe(json)).toEqual(JSON.stringify(expected))
  })
})
