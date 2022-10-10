export const BxsRocket = (
  props: React.SVGProps<SVGSVGElement>,
): JSX.Element => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      height="1em"
      width="1em"
      {...props}
    >
      <path
        fill="none"
        d="M17.695999999999998 8.272 A2 2 0 0 1 15.696 10.272 A2 2 0 0 1 13.696 8.272 A2 2 0 0 1 17.695999999999998 8.272 z"
      />
      <path d="M15.784 15.843s2.855-2.855 3.831-3.829c3.063-3.063 1.531-9.191 1.531-9.191s-6.128-1.532-9.191 1.532c-2.29 2.29-3.816 3.867-3.816 3.867s-3.843-.804-6.141 1.494l12.255 12.255c2.298-2.298 1.531-6.128 1.531-6.128zm-1.502-8.985a1.998 1.998 0 012.828 0 2 2 0 11-2.828 0zM2.969 20.969s3 0 5-2l-3-3c-2 1-2 5-2 5z" />
    </svg>
  )
}

export default BxsRocket
