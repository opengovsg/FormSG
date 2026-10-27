import { expandFileTypes, splitFileTypes } from '../file-validation'

describe('attachment file type presets', () => {
  it('expands the PDF preset to .pdf', () => {
    expect(expandFileTypes({ presets: ['pdf'], advanced: [] })).toEqual([
      '.pdf',
    ])
  })

  it('reopens a saved list as fully covered presets plus Advanced picks', () => {
    expect(splitFileTypes(['.msg', '.pdf'])).toEqual({
      presets: ['pdf'],
      advanced: ['.msg'],
    })
  })
})
