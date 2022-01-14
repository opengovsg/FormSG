import { forwardRef, memo, Ref, SVGProps } from 'react'

export const AuthImageSvgr = memo(
  forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
    <svg
      width={118}
      height={144}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      ref={ref}
      {...props}
    >
      <path
        d="M113.902.402h-.25v143.196h3.515V.402h-3.265Z"
        fill="#293044"
        stroke="#293044"
        strokeWidth={0.5}
      />
      <path
        d="M1.083.402h-.25v143.196H113.882V.402H1.083Z"
        fill="#fff"
        stroke="#293044"
        strokeWidth={0.5}
      />
      <path d="M1.083 14.88h112.759v41.974H1.084V14.88Z" fill="#4A61C0" />
      <path
        d="M18.03 29.137h78.838v1.14H18.031v-1.14ZM18.03 35.322h78.838v1.14H18.03v-1.14ZM33.794 41.512h47.793v1.14H33.794v-1.14Z"
        fill="#8998D6"
      />
      <rect
        x={45.554}
        y={48.123}
        width={26.029}
        height={26.029}
        rx={3.5}
        fill="#293044"
        stroke="#293044"
      />
      <rect
        x={43.083}
        y={45.652}
        width={27.029}
        height={27.029}
        rx={4}
        fill="url(#a)"
      />
      <rect x={20.083} y={83.652} width={76} height={8} rx={4} fill="#E4E7F6" />
      <rect x={20.083} y={99.652} width={76} height={8} rx={4} fill="#E4E7F6" />
      <rect
        x={20.083}
        y={115.652}
        width={76}
        height={8}
        rx={4}
        fill="#E4E7F6"
      />
      <defs>
        <pattern
          id="a"
          patternContentUnits="objectBoundingBox"
          width={1}
          height={1}
        >
          <use
            xlinkHref="#b"
            transform="matrix(.00714 0 0 .00714 -.079 -.079)"
          />
        </pattern>
        <svg
          id="b"
          width={162}
          height={162}
          viewBox="0 0 180 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          ref={ref}
          {...props}
        >
          <rect width={180} height={180} rx={22.5} fill="#F4333D" />
          <mask
            id="c"
            mask-type="alpha"
            maskUnits="userSpaceOnUse"
            x={69}
            y={33}
            width={42}
            height={113}
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M69.412 33.75h40.732v111.364H69.412V33.75Z"
              fill="#fff"
            />
          </mask>
          <g mask="url(#c)">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M69.39 145.114h40.732l-8.666-67.382c-6.5 1.95-16.9 1.95-23.4 0l-8.666 67.382Zm20.365-73.666c-10.616 0-18.85-8.233-18.85-18.849s8.234-18.85 18.85-18.85c10.617 0 18.85 8.233 18.85 18.85 0 10.616-8.233 18.85-18.85 18.85Z"
              fill="#fff"
            />
          </g>
        </svg>
      </defs>
    </svg>
  )),
)
