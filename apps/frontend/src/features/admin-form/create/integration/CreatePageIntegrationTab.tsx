import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BiRightArrowAlt } from 'react-icons/bi'
import {
  Badge,
  Box,
  chakra,
  Container,
  Flex,
  HTMLChakraProps,
  Icon,
  Image,
  Stack,
  Text,
} from '@chakra-ui/react'

// Ported from opengovsg/suite
// https://github.com/opengovsg/suite/blob/c4a665c9232ff42823da898b0dd9814f667c12cc/apps/suite/src/app/apps/product-grid.tsx#L9
/** A launcher tile, fully resolved on the server (href already carries `?iss=`). */
export interface LauncherTile {
  name: string
  href: string
  domain?: string
  description?: string
  /** Host-allowlisted product logo; absent means the tile shows its monogram. */
  logoUrl?: string
}

// Ported from opengovsg/suite, with Camp palette values mapped to theme tokens
// https://github.com/opengovsg/suite/blob/c4a665c9232ff42823da898b0dd9814f667c12cc/packages/common/src/product-mark.ts
const ACCENTS = [
  'primary.500',
  'success.500',
  'danger.500',
  'secondary.600',
  'primary.600',
  'warning.500',
  'success.700',
  'danger.600',
] as const

/** Derive a stable monogram + accent for a product tile from its display name. */
const productMark = (name: string): { monogram: string; accent: string } => {
  const trimmed = name.trim()
  const monogram = (trimmed.match(/[a-z0-9]/i)?.[0] ?? '?').toUpperCase()

  // FNV-ish rolling hash over the name → a stable index into the accent palette.
  let hash = 0
  for (let i = 0; i < trimmed.length; i++) {
    hash = (hash * 31 + trimmed.charCodeAt(i)) >>> 0
  }
  const accent = ACCENTS[hash % ACCENTS.length]

  return { monogram, accent }
}

// Ported from opengovsg/suite
// https://github.com/opengovsg/suite/blob/c4a665c9232ff42823da898b0dd9814f667c12cc/apps/suite/src/components/brand/ProductLogo.tsx
/**
 * Product mark: the product logo, or a deterministic accent monogram when there
 * isn't one or it fails to load.
 */
const ProductLogo = ({
  name,
  logoUrl,
  size = '2.5rem',
}: {
  name: string
  logoUrl?: string
  size?: string
}): JSX.Element => {
  const { monogram, accent } = productMark(name)
  const [failedUrl, setFailedUrl] = useState<string | null>(null)

  if (logoUrl && failedUrl !== logoUrl) {
    // `alt=""` on purpose: the product name sits immediately beside the logo,
    // so a real alt would double-announce it to screen readers.
    return (
      <Image
        src={logoUrl}
        alt=""
        boxSize={size}
        objectFit="contain"
        onError={() => setFailedUrl(logoUrl)}
      />
    )
  }

  return (
    <Flex
      align="center"
      justify="center"
      boxSize={size}
      borderRadius="4px"
      bg={accent}
      color="white"
      textStyle="subhead-1"
    >
      {monogram}
    </Flex>
  )
}

export interface ProductTileProps extends HTMLChakraProps<'a'> {
  /** Product display name — drives the monogram, accent, and title. */
  name: string
  /** Tile destination. */
  href: string
  /** Optional domain shown beside the title, e.g. `form.gov.sg`. */
  domain?: string
  /** Optional one-line description. */
  description?: string
  /**
   * Optional product logo. Falls back to the monogram when absent or when the
   * image fails to load.
   */
  logoUrl?: string
}

// Ported from opengovsg/suite, restyled to the logic/workflow block convention
// https://github.com/opengovsg/suite/blob/c4a665c9232ff42823da898b0dd9814f667c12cc/apps/suite/src/components/brand/ProductTile.tsx#L59
export const ProductTile = ({
  name,
  href,
  domain,
  description,
  logoUrl,
  ...props
}: ProductTileProps): JSX.Element => {
  return (
    <chakra.a
      href={href}
      // `data-group` rather than `role="group"` so the tile keeps its link role.
      data-group
      display="flex"
      gap="1rem"
      px={{ base: '1.5rem', md: '2rem' }}
      py={{ base: '1rem', md: '1.5rem' }}
      bg="white"
      border="1px solid"
      borderColor="neutral.300"
      borderRadius="4px"
      transition="border-color 0.15s"
      _hover={{ borderColor: 'secondary.300' }}
      {...props}
    >
      <ProductLogo name={name} logoUrl={logoUrl} />
      <Box flex={1} minW={0}>
        <Text as="h3" textStyle="h4">
          {name}
        </Text>
        {domain ? (
          <Text textStyle="caption-2" color="secondary.400" mt="0.125rem">
            {domain}
          </Text>
        ) : null}
        {description ? (
          <Text textStyle="body-2" color="secondary.400" mt="0.5rem">
            {description}
          </Text>
        ) : null}
      </Box>
      <Icon
        as={BiRightArrowAlt}
        aria-hidden
        alignSelf="center"
        fontSize="1.5rem"
        opacity={0}
        transform="translateX(-0.25rem)"
        transition="opacity 0.2s ease-out, transform 0.2s ease-out"
        _groupHover={{ opacity: 1, transform: 'translateX(0)' }}
      />
    </chakra.a>
  )
}

// Ported from opengovsg/suite, without the server-computed greeting
// https://github.com/opengovsg/suite/blob/c4a665c9232ff42823da898b0dd9814f667c12cc/apps/suite/src/app/apps/product-grid.tsx#L39
export const LauncherApps = ({
  tiles,
}: {
  tiles: LauncherTile[]
}): JSX.Element => {
  const { t } = useTranslation()

  return (
    <Flex flexDir="column" color="secondary.500">
      {/* Cardless centred header, as on the logic and workflow intros. */}
      <Flex
        textAlign="center"
        flexDir="column"
        align="center"
        pt={{ base: '0.5rem', md: '2.75rem' }}
      >
        <Text as="h2" textStyle="h2">
          {t('features.adminForm.sidebar.integration.header.title')}
          {/* Inline so the badge trails the last word rather than the whole block. */}
          <Badge
            as="span"
            colorScheme="primary"
            variant="subtle"
            color="secondary.500"
            borderRadius="full"
            ml="0.5rem"
            verticalAlign="middle"
            whiteSpace="nowrap"
          >
            {t('features.common.betaBadgeLabel')}
          </Badge>
        </Text>
        <Text textStyle="body-1" mt="1rem">
          {t('features.adminForm.sidebar.integration.header.description')}
        </Text>
      </Flex>

      {tiles.length === 0 ? (
        <Flex textAlign="center" flexDir="column" align="center" mt="2.5rem">
          <Text textStyle="subhead-1">
            {t('features.adminForm.sidebar.integration.empty.title')}
          </Text>
          <Text textStyle="body-2" color="secondary.400" mt="0.375rem">
            {t('features.adminForm.sidebar.integration.empty.description')}
          </Text>
        </Flex>
      ) : (
        <Stack mt="2.5rem" spacing="1rem">
          {tiles.map((tile) => (
            <ProductTile key={tile.name} {...tile} />
          ))}
        </Stack>
      )}
    </Flex>
  )
}

const TILES: LauncherTile[] = [
  {
    name: 'Plumber',
    href: 'https://plumber.gov.sg/login/sso?iss=https%3A%2F%2Fone.gov.sg%2Fapi%2Fauth',
    domain: 'plumber.gov.sg',
    description: 'Automate workflows with AI',
    logoUrl: 'https://file.go.gov.sg/plumber-logo.png',
  },
]

export const CreatePageIntegrationTab = (): JSX.Element => {
  return (
    <Box
      flex={1}
      overflow="auto"
      bg="neutral.100"
      py={{ base: '2rem', md: '1rem' }}
      px={{ base: '1.5rem', md: '3.75rem' }}
    >
      <Container p={0} maxW="42.5rem">
        <LauncherApps tiles={TILES} />
      </Container>
    </Box>
  )
}
