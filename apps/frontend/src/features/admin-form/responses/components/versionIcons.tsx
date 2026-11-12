import { SVGProps } from 'react'

const versionIcon = (label: string) => {
  const VersionIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" {...props}>
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill="currentColor"
      >
        {label}
      </text>
    </svg>
  )
  return VersionIcon
}

/** Switch thumb icons for a V1/V2 beta toggle. */
export const V1Icon = versionIcon('V1')
export const V2Icon = versionIcon('V2')
