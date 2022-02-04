// Retrieved from https://reactsvgicons.com/boxicons

import { forwardRef } from 'react'

export const BxsChevronUp = forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement>
>((props, ref): JSX.Element => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      height="1em"
      width="1em"
      {...props}
      ref={ref}
    >
      <path d="M6.293 13.293l1.414 1.414L12 10.414l4.293 4.293 1.414-1.414L12 7.586z" />
    </svg>
  )
})
