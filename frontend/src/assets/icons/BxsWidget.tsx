export const BxsWidget = (
  props: React.SVGProps<SVGSVGElement>,
): JSX.Element => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      height="1em"
      width="1em"
      {...props}
    >
      <path d="M4 11h6a1 1 0 001-1V4a1 1 0 00-1-1H4a1 1 0 00-1 1v6a1 1 0 001 1zm0 10h6a1 1 0 001-1v-6a1 1 0 00-1-1H4a1 1 0 00-1 1v6a1 1 0 001 1zm10 0h6a1 1 0 001-1v-6a1 1 0 00-1-1h-6a1 1 0 00-1 1v6a1 1 0 001 1zm7.293-14.707l-3.586-3.586a.999.999 0 00-1.414 0l-3.586 3.586a.999.999 0 000 1.414l3.586 3.586a.999.999 0 001.414 0l3.586-3.586a.999.999 0 000-1.414z" />
    </svg>
  )
}
