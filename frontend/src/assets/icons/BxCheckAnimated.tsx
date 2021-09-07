import { motion } from 'framer-motion'
import { omit } from 'lodash'

export const BxCheckAnimated = ({
  isChecked,
  ...props
}: React.SVGProps<SVGSVGElement> & { isChecked?: boolean }): JSX.Element => {
  // Required to prevent React warnings about unsupported props
  const svgProps = omit(props, ['isIndeterminate'])
  return (
    <svg
      viewBox="0 0 12 10"
      fill="currentColor"
      height="1em"
      width="1em"
      {...svgProps}
    >
      <motion.polyline
        points="1.5 6 4.5 9 10.5 1"
        style={{
          fill: 'none',
          strokeWidth: 2,
          stroke: 'currentColor',
          strokeDasharray: 16,
        }}
        variants={{
          checked: {
            opacity: 1,
            scale: 1,
            strokeDashoffset: 0,
            transition: { duration: 0.2 },
          },
          unchecked: {
            opacity: 0,
            scale: 0.8,
            strokeDashoffset: 16,
          },
        }}
        animate={isChecked ? 'checked' : 'unchecked'}
        initial="unchecked"
      />
    </svg>
  )
}
