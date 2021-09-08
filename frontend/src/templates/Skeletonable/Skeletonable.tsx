export interface SkeletonableProps<T extends unknown = unknown> {
  children?: T
  skeleton: React.ReactNode
}

export const Skeletonable = ({
  children,
  skeleton,
}: SkeletonableProps): JSX.Element => {
  return <>{children || skeleton}</>
}
