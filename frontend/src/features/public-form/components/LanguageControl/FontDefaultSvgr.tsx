import { forwardRef, memo, SVGProps } from 'react'
import { chakra } from '@chakra-ui/react'

const MemoFontDefaultSvgr = memo(
  forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>((props, ref) => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      ref={ref}
    >
      <path
        d="M7.97659 15.9912L7.96392 16.025H8H9.0685H9.08582L9.09191 16.0088L10.0233 13.525H13.1702L14.1016 16.0088L14.1077 16.025H14.125H15.1935H15.2296L15.2169 15.9912L12.2169 7.99122L12.2108 7.975H12.1935H11V8L10.9766 7.99122L7.97659 15.9912ZM12.7764 12.475H10.4166L11.5965 9.3287L12.7764 12.475Z"
        fill="#445072"
        stroke="#445072"
        stroke-width="0.05"
      />
    </svg>
  )),
)

export const FontDefaultSvgr = chakra(MemoFontDefaultSvgr)
