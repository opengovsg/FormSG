import { IconType } from 'react-icons/lib'
import {
  Button,
  ButtonProps,
  forwardRef,
  HStack,
  Icon,
  ListItem,
  StylesProvider,
  Text,
  TextProps,
  useMultiStyleConfig,
  useStyles,
} from '@chakra-ui/react'

export interface TileProps
  extends Omit<
    ButtonProps,
    | 'colorScheme'
    | 'iconSpacing'
    | 'leftIcon'
    | 'rightIcon'
    | 'loadingText'
    | 'spinner'
    | 'spinnerPlacement'
    | 'title'
  > {
  // The typing here is to satisfy the ts compiler
  // because otherwise, it will complain about assigning null to the as prop
  /**
   * The icon that should be displayed on the tile
   */
  icon: IconType

  /**
   * The components to be displayed
   * Refer here for correct typing: https://stackoverflow.com/questions/53688899/typescript-and-react-children-type
   */
  children: React.ReactNode

  /**
   * The badge, if any, to be displayed alongside the title
   */
  badge?: JSX.Element
  /**
   * The variant of the tile - whether it is complex (many elements) or simple (title and subtitle only).
   * Defaults to simple.
   */
  variant: TileVariant
}

type TileVariant = 'complex' | 'simple'
export const Tile = forwardRef<TileProps, 'button'>(
  ({ badge, icon, variant = 'simple', children, isActive, ...props }, ref) => {
    const styles = useMultiStyleConfig('Tile', { variant, isActive })
    return (
      // Ref passed into the component as a whole so that it can be focused
      <StylesProvider value={styles}>
        <Button sx={styles.container} ref={ref} {...props}>
          <HStack spacing="1rem">
            <Icon sx={styles.icon} as={icon}></Icon>
            {badge}
          </HStack>
          {children}
        </Button>
      </StylesProvider>
    )
  },
)

export const TileTitle = (props: TextProps): JSX.Element => {
  const styles = useStyles()
  // Allow consumers to override default style props with their own styling
  return <Text sx={styles.title} {...props} />
}

export const TileSubtitle = (props: TextProps): JSX.Element => {
  const styles = useStyles()
  // Allow consumers to override default style props with their own styling
  return <Text sx={styles.subtitle} {...props} />
}

export const TileText = (props: TextProps): JSX.Element => {
  return <Text color="secondary.400" {...props} />
}

export const TileListItem = (props: TextProps): JSX.Element => {
  return (
    <ListItem>
      <TileText textStyle="body-2" textAlign="left" {...props} />
    </ListItem>
  )
}
