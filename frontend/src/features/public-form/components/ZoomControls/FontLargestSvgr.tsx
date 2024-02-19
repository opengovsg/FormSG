import { forwardRef, memo, SVGProps } from 'react'
import { chakra } from '@chakra-ui/react'

const MemoFontLargestSvgr = memo(
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
        d="M11.3071 4L5.30713 20H7.44413L9.31913 15H15.6821L17.5571 20H19.6941L13.6941 4H11.3071V4ZM10.0681 13L12.5001 6.515L14.9321 13H10.0681V13Z"
        fill="#445072"
      />
    </svg>
  )),
)

export const FontLargestSvgr = chakra(MemoFontLargestSvgr)
