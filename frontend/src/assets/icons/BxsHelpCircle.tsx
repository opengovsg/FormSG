import { forwardRef } from 'react'

export const BxsHelpCircle = forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement>
>((props, ref) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      height="1em"
      width="1em"
      ref={ref}
      {...props}
    >
      <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm1 16h-2v-2h2v2zm.976-4.885c-.196.158-.385.309-.535.459-.408.407-.44.777-.441.793v.133h-2v-.167c0-.118.029-1.177 1.026-2.174.195-.195.437-.393.691-.599.734-.595 1.216-1.029 1.216-1.627a1.934 1.934 0 00-3.867.001h-2C8.066 7.765 9.831 6 12 6s3.934 1.765 3.934 3.934c0 1.597-1.179 2.55-1.958 3.181z" />
    </svg>
  )
})
