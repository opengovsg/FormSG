import { ChangeEventHandler, forwardRef, useEffect, useState } from 'react'
import { Cell, Column, useTable } from 'react-table'

import Input from '~components/Input'

interface Table1Props {
  columns: Column[]
  // eslint-disable-next-line @typescript-eslint/ban-types
  data: object[]

  handleDataChange: (index: number, id: string, value: string) => void
}

interface EditableCellProps
  extends Cell<never, string>,
    Pick<Table1Props, 'handleDataChange'> {}

// Create an editable cell renderer
const EditableCell = ({
  value: initialValue,
  row: { index },
  column: { id },
  handleDataChange,
}: EditableCellProps) => {
  // We need to keep and update the state of the cell normally
  const [value, setValue] = useState(initialValue)

  const onChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setValue(e.target.value)
  }

  // Only update the external data when the input is blurred.
  const onBlur = () => {
    handleDataChange(index, id, value)
  }

  // If the initialValue is changed external, sync it up with our state
  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  return <Input value={value} onChange={onChange} onBlur={onBlur} />
}

const defaultColumn = {
  Cell: EditableCell,
}

export const Table1 = forwardRef(
  ({ columns, data, handleDataChange }: Table1Props, ref) => {
    // Use the state and functions returned from useTable to build your UI
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
      useTable({
        columns,
        data,
        defaultColumn,
        // `react-table` allows passing of extra props that will be invoked by
        // the rendered Cell.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        handleDataChange,
      })

    // Render the UI for your table
    return (
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()}>{column.render('Header')}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row)
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell, j) => {
                  return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  },
)

// export default function Table({ columns, data, ...rest }) {
//   // Use the state and functions returned from useTable to build your UI
//   const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
//     useTable({
//       columns,
//       data,
//     })

//   // Render the UI for your table
//   return (
//     <table {...getTableProps()}>
//       <thead>
//         {headerGroups.map((headerGroup) => (
//           <tr {...headerGroup.getHeaderGroupProps()}>
//             {headerGroup.headers.map((column) => (
//               <th {...column.getHeaderProps()}>{column.render('Header')}</th>
//             ))}
//           </tr>
//         ))}
//       </thead>
//       <tbody {...getTableBodyProps()}>
//         {rows.map((row, i) => {
//           prepareRow(row)
//           return (
//             <tr {...row.getRowProps()}>
//               {row.cells.map((cell) => {
//                 return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
//               })}
//             </tr>
//           )
//         })}
//       </tbody>
//     </table>
//   )
// }
