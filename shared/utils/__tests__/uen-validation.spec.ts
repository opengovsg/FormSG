import { isUenValid } from '../uen-validation'

describe('isUenValid', () => {
  const localCoy = [
    '201608355W',
    '201932505K',
    '201932529Z',
    '201615963E',
    '201616400Z',
    '201616403M',
    '201622938K',
    '201622940R',
    '201622942W',
    '201622945K',
    '201622947M',
    '201622949N',
    '201625295C',
    '201625297D',
    '201625299E',
    '201625302H',
    '201625311K',
    '201625312C',
    '201626633W',
    '201626635Z',
    '201626636K',
    '201703427W',
    '201703429Z',
    '201703432R',
    '201703434W',
    '201707903G',
    '201707905H',
    '201707920Z',
    '201716165K',
    '201716185R',
    '201716186G',
    '201716187W',
    '201716188H',
    '201716189Z',
    '201720961D',
  ]
  const business = [
    '53333127K',
    '53333132C',
    '53333133A',
    '53333286M',
    '53334620K',
    '53339179B',
    '53339181D',
    '53339185K',
    '53339191A',
    '53339219E',
    '53339220M',
    '53339221K',
    '53339224A',
    '53339550W',
    '53339553D',
    '53339554B',
    '53344401B',
    '53344402X',
    '53344404K',
    '53344409L',
    '53344412L',
    '53344413J',
    '53344414D',
    '53344417M',
    '53344420M',
    '53346090E',
    '53355848D',
    '53355850J',
    '53358965K',
    '53358966E',
    '53358969W',
    '53358970C',
    '53358972W',
    '53364379A',
    '53364394E',
  ]
  const others = [
    'S13SS0001G',
    'S36CS0039B',
    'S37SS0006B',
    'S37SS0013H',
    'S37SS0014D',
    'S39CS0041K',
    'S39SS0014C',
    'S46CS0044H',
    'S46TU0001K',
    'S46TU0002F',
    'S46TU0003B',
    'S46TU0004J',
    'S47SS0014G',
    'S62SS0014K',
    'T09SS0032E',
    'T09SS0034H',
    'T09SS0035D',
    'T09SS0036L',
    'T09SS0042K',
    'T09SS0048H',
    'T09SS0050A',
    'T09SS0053L',
    'T09SS0056K',
    'T09SS0058B',
    'T09SS0060F',
    'T09SS0062J',
    'T09SS0063E',
    'T09SS0064A',
    'T16LL0604C',
    'T16UF2321H',
    'T16UF4146J',
    'T16UF7020E',
    'T16UF7023D',
    'T16UF7025G',
    'T16UF7437A',
  ]
  const checksumCases = [
    '53333286M',
    'T09SS0034H',
    '53339179B',
    'S36CS0039B',
    '201707903G',
  ]

  it('should pass all Local Company UEN', () => {
    // happy path
    for (let i = 0; i < localCoy.length; i++) {
      const test_uen = localCoy[i]
      expect(isUenValid(test_uen)).toBe(true)
    }
  })

  it('should pass all business UEN', () => {
    // happy path
    for (let i = 0; i < business.length; i++) {
      const test_uen = business[i]
      expect(isUenValid(test_uen)).toBe(true)
    }
  })

  it('should pass all other UEN', () => {
    // happy path
    for (let i = 0; i < others.length; i++) {
      const test_uen = others[i]
      expect(isUenValid(test_uen)).toBe(true)
    }
  })

  it('should fail wrong checksum digits for all variants', () => {
    // verify checksum
    for (let i = 0; i < checksumCases.length; i++) {
      const temp = checksumCases[i].slice(0, -1)
      const digit = checksumCases[i].slice(-1)
      const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
      for (let j = 0; j < alpha.length; j++) {
        const test_string = temp.concat(alpha[j])
        if (alpha[j] !== digit) {
          expect(isUenValid(test_string)).toBe(false)
        } else {
          expect(isUenValid(test_string)).toBe(true)
        }
      }
    }
  })
})
