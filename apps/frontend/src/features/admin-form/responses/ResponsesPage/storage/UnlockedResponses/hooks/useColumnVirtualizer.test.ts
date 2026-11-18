import {
  computeColumnWindow,
  EMPTY_COLUMN_WINDOW,
} from './useColumnVirtualizer'

// Ten columns of 100px, so offsets land on round numbers.
const WIDTHS = Array.from({ length: 10 }, () => 100)
const VIEWPORT = 250

const windowAt = (scrollLeft: number, overscan = 0, widths = WIDTHS) =>
  computeColumnWindow({
    columnWidths: widths,
    scrollLeft,
    viewportWidth: VIEWPORT,
    overscan,
  })

describe('the virtual column window', () => {
  it('renders from the first column when scrolled to the left edge', () => {
    expect(windowAt(0)).toEqual({
      startIndex: 0,
      endIndex: 3,
      paddingLeft: 0,
      paddingRight: 700,
    })
  })

  it('moves the window along as the table scrolls sideways', () => {
    expect(windowAt(400)).toMatchObject({ startIndex: 4, endIndex: 7 })
  })

  it('keeps a column that is only partly in view', () => {
    // 250..500 straddles columns 2, 3 and 4.
    expect(windowAt(250)).toMatchObject({ startIndex: 2, endIndex: 5 })
  })

  it('pads left and right to the full width of the table', () => {
    const { paddingLeft, paddingRight, startIndex, endIndex } = windowAt(400)
    const rendered = (endIndex - startIndex) * 100

    expect(paddingLeft + rendered + paddingRight).toBe(1000)
  })

  it('stops at the last column at the right edge', () => {
    const { endIndex, paddingRight } = windowAt(750)

    expect(endIndex).toBe(10)
    expect(paddingRight).toBe(0)
  })

  it('widens the window by the overscan on both sides', () => {
    const tight = windowAt(400, 0)
    const loose = windowAt(400, 2)

    expect(loose.startIndex).toBe(tight.startIndex - 2)
    expect(loose.endIndex).toBe(tight.endIndex + 2)
  })

  it('handles columns of differing widths', () => {
    const widths = [50, 300, 50, 300, 300]
    // 0..250 covers the 50, then most of the 300.
    expect(windowAt(0, 0, widths)).toMatchObject({
      startIndex: 0,
      endIndex: 2,
      paddingLeft: 0,
      paddingRight: 650,
    })
  })

  it('renders nothing measurable for an empty or unmeasured table', () => {
    expect(windowAt(0, 0, [])).toEqual(EMPTY_COLUMN_WINDOW)
    expect(
      computeColumnWindow({
        columnWidths: WIDTHS,
        scrollLeft: 0,
        viewportWidth: 0,
      }),
    ).toEqual(EMPTY_COLUMN_WINDOW)
    // All-zero widths cannot place any column, which the caller reads as a
    // signal to render every column rather than none.
    expect(windowAt(0, 0, [0, 0, 0])).toEqual(EMPTY_COLUMN_WINDOW)
  })

  it('never renders more columns than the viewport can hold, whatever the count', () => {
    const { startIndex, endIndex } = windowAt(5000, 2, Array(500).fill(100))

    expect(endIndex - startIndex).toBeLessThanOrEqual(
      Math.ceil(VIEWPORT / 100) + 5,
    )
  })
})
