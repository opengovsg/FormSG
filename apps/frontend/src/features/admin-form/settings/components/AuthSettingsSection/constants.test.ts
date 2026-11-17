import { FormAuthType } from 'formsg-shared/types/form'

import { getLoginOptionsKeepingLegacySingpass } from './constants'

describe('getLoginOptionsKeepingLegacySingpass', () => {
  it('offers Singpass with Myinfo by default', () => {
    expect(getLoginOptionsKeepingLegacySingpass(FormAuthType.NIL)).toEqual([
      FormAuthType.NIL,
      FormAuthType.MyInfo,
      FormAuthType.CP,
    ])
  })

  it('keeps a saved legacy Singpass login in place of Myinfo', () => {
    expect(getLoginOptionsKeepingLegacySingpass(FormAuthType.SP)).toEqual([
      FormAuthType.NIL,
      FormAuthType.SP,
      FormAuthType.CP,
    ])
  })
})
