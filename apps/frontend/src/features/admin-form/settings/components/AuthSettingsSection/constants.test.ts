import { FormAuthType } from 'formsg-shared/types/form'

import { getLoginOptions } from './constants'

describe('getLoginOptions', () => {
  it('offers Singpass with Myinfo by default', () => {
    expect(getLoginOptions(FormAuthType.NIL)).toEqual([
      FormAuthType.NIL,
      FormAuthType.MyInfo,
      FormAuthType.CP,
    ])
  })

  it('keeps a saved legacy Singpass login in place of Myinfo', () => {
    expect(getLoginOptions(FormAuthType.SP)).toEqual([
      FormAuthType.NIL,
      FormAuthType.SP,
      FormAuthType.CP,
    ])
  })
})
