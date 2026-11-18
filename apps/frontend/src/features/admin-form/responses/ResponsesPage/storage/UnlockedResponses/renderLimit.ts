import { TABLE_ROW_RENDER_CHUNK } from '../../../constants'

/**
 * The smallest whole number of chunks that renders the row at `rowIndex`, or
 * the current limit if that row is already shown. Rows are only revealed in
 * chunks, so a response reached from the drawer is in the table on close.
 */
export const renderLimitToInclude = (
  rowIndex: number,
  renderLimit: number,
): number => {
  if (rowIndex < renderLimit) return renderLimit
  return (
    Math.ceil((rowIndex + 1) / TABLE_ROW_RENDER_CHUNK) * TABLE_ROW_RENDER_CHUNK
  )
}
