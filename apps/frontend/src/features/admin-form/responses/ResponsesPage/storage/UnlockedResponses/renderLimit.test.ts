import { TABLE_ROW_RENDER_CHUNK } from '../../../constants'

import { renderLimitToInclude } from './renderLimit'

describe('the rows to render for a response', () => {
  it('keeps the limit when the row is already rendered', () => {
    expect(renderLimitToInclude(0, TABLE_ROW_RENDER_CHUNK)).toBe(
      TABLE_ROW_RENDER_CHUNK,
    )
    expect(
      renderLimitToInclude(TABLE_ROW_RENDER_CHUNK - 1, TABLE_ROW_RENDER_CHUNK),
    ).toBe(TABLE_ROW_RENDER_CHUNK)
  })

  it('never shrinks a limit the admin has already expanded', () => {
    expect(renderLimitToInclude(0, TABLE_ROW_RENDER_CHUNK * 3)).toBe(
      TABLE_ROW_RENDER_CHUNK * 3,
    )
  })

  it('reveals whole chunks up to and including the row', () => {
    expect(
      renderLimitToInclude(TABLE_ROW_RENDER_CHUNK, TABLE_ROW_RENDER_CHUNK),
    ).toBe(TABLE_ROW_RENDER_CHUNK * 2)
    expect(
      renderLimitToInclude(TABLE_ROW_RENDER_CHUNK * 2, TABLE_ROW_RENDER_CHUNK),
    ).toBe(TABLE_ROW_RENDER_CHUNK * 3)
  })
})
