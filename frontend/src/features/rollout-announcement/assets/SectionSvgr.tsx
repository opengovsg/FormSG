import { forwardRef, memo, SVGProps } from 'react'
import { chakra } from '@chakra-ui/react'

const MemoSectionSvgr = memo(
  forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>((props, ref) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="96"
      height="96"
      viewBox="0 0 96 96"
      fill="none"
      ref={ref}
      {...props}
    >
      <g clip-path="url(#clip0_8540_116515)">
        <rect width="96" height="96" fill="#F6F7FC" />
        <path
          d="M21.25 -13.75H74.75V17C74.75 21.2802 71.2802 24.75 67 24.75H29C24.7198 24.75 21.25 21.2802 21.25 17V-13.75Z"
          fill="white"
          stroke="black"
          stroke-width="0.5"
        />
        <rect
          x="74.75"
          y="67.75"
          width="53.5"
          height="38.5"
          rx="7.75"
          transform="rotate(-180 74.75 67.75)"
          fill="white"
          stroke="black"
          stroke-width="0.5"
        />
        <path
          d="M74.75 110.75L21.25 110.75L21.25 80C21.25 75.7198 24.7198 72.25 29 72.25L67 72.25C71.2802 72.25 74.75 75.7198 74.75 80L74.75 110.75Z"
          fill="white"
          stroke="black"
          stroke-width="0.5"
        />
      </g>
      <defs>
        <clipPath id="clip0_8540_116515">
          <rect width="96" height="96" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )),
)

export const SectionSvgr = chakra(MemoSectionSvgr)
