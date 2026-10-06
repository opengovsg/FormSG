import { useMemo, useState } from 'react'
import { BiRightArrowAlt, BiSearch } from 'react-icons/bi'
import {
  Box,
  chakra,
  Container,
  Flex,
  HTMLChakraProps,
  Icon,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
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
  size = 48,
}: {
  name: string
  logoUrl?: string
  size?: number
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
        boxSize={`${size}px`}
        objectFit="contain"
        onError={() => setFailedUrl(logoUrl)}
      />
    )
  }

  return (
    <Flex
      align="center"
      justify="center"
      boxSize={`${size}px`}
      borderRadius="xl"
      bg={accent}
      color="white"
      fontFamily="mono"
      fontSize="md"
      fontWeight={600}
      letterSpacing="-0.02em"
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

// Ported from opengovsg/suite
// https://github.com/opengovsg/suite/blob/c4a665c9232ff42823da898b0dd9814f667c12cc/apps/suite/src/components/brand/ProductTile.tsx#L59
/**
 * A single launcher tile: the product logo (or a deterministic accent monogram
 * when there isn't one), the product name over its domain, an optional
 * description, and — once the officer has opened the product — a last-sign-in
 * line (dot + mono time).
 *
 * The tiles form a "ruled sheet": the tile draws its right and bottom hairline
 * and the containing grid draws the top and left. The tile is a transparent
 * target, filled white on hover, with the arrow revealed only then.
 */
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
      pos="relative"
      display="flex"
      flexDir="column"
      gap="0.875rem"
      minH="200px"
      p="1.5rem"
      borderTop="1px solid"
      borderBottom="1px solid"
      borderRight="1px solid"
      borderColor="neutral.300"
      transition="background-color 0.15s"
      _hover={{ bg: 'white' }}
      {...props}
    >
      <Icon
        as={BiRightArrowAlt}
        aria-hidden
        pos="absolute"
        top="1.5rem"
        right="1.5rem"
        boxSize="1.25rem"
        color="secondary.700"
        opacity={0}
        transform="translateX(-0.25rem)"
        transition="opacity 0.2s ease-out, transform 0.2s ease-out"
        _groupHover={{ opacity: 1, transform: 'translateX(0)' }}
      />
      <ProductLogo name={name} logoUrl={logoUrl} size={40} />
      <Box minW={0}>
        <Text
          as="span"
          display="block"
          fontSize="xl"
          fontWeight={500}
          letterSpacing="-0.01em"
          color="secondary.700"
        >
          {name}
        </Text>
        {domain && (
          <Text
            as="span"
            display="block"
            mt="0.125rem"
            wordBreak="break-all"
            fontFamily="mono"
            fontSize="xs"
            color="secondary.400"
          >
            {domain}
          </Text>
        )}
      </Box>
      {/* `flex={1}` so the last-sign-in line sits on the same bottom edge in every cell. */}
      <Text
        m={0}
        flex={1}
        noOfLines={2}
        fontSize="sm"
        lineHeight="tall"
        color="secondary.400"
      >
        {description}
      </Text>
    </chakra.a>
  )
}

// Ported from opengovsg/suite, without the server-computed greeting
// https://github.com/opengovsg/suite/blob/c4a665c9232ff42823da898b0dd9814f667c12cc/apps/suite/src/app/apps/product-grid.tsx#L39
/**
 * Launcher body: a live "Search products" filter over the product-tile grid,
 * with empty states for no tiles and no matches.
 */
export const LauncherApps = ({
  tiles,
}: {
  tiles: LauncherTile[]
}): JSX.Element => {
  const [query, setQuery] = useState('')
  const hasTiles = tiles.length > 0

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return tiles
    return tiles.filter(
      (tile) =>
        tile.name.toLowerCase().includes(q) ||
        tile.domain?.toLowerCase().includes(q) ||
        tile.description?.toLowerCase().includes(q),
    )
  }, [query, tiles])

  return (
    <>
      <Flex
        mb="2.5rem"
        gap="1.5rem"
        wrap="wrap"
        justify="space-between"
        align={{ base: 'flex-start', md: 'flex-end' }}
        direction={{ base: 'column', md: 'row' }}
      >
        <Text textStyle="body-1" color="secondary.400">
          Open connected Suite products - no login needed.
        </Text>
        {hasTiles ? (
          <InputGroup w="260px" maxW="100%">
            <InputLeftElement>
              <Icon as={BiSearch} color="secondary.500" fontSize="1.25rem" />
            </InputLeftElement>
            <Input
              type="search"
              placeholder="Search products"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search products"
            />
          </InputGroup>
        ) : null}
      </Flex>

      <Box borderTop="1px solid" borderColor="neutral.300" />

      {!hasTiles ? (
        <Box
          mt="2.5rem"
          px="1.5rem"
          py="3.5rem"
          textAlign="center"
          borderRadius="xl"
          border="1px dashed"
          borderColor="neutral.300"
        >
          <Text textStyle="subhead-1" color="secondary.700">
            No apps are available in the launcher yet.
          </Text>
          <Text mt="0.375rem" textStyle="body-2" color="secondary.400">
            Once a product opts into the directory, it will appear here for you
            to launch.
          </Text>
        </Box>
      ) : filtered.length > 0 ? (
        // Ruled sheet: the grid draws the left hairlines and each tile its
        // right/bottom/top, so the columns must be explicit per breakpoint — an
        // auto-fit grid would leave a short last row's right rule floating.
        <SimpleGrid
          mt="1.5rem"
          columns={{ base: 1, sm: 2, lg: 3 }}
          borderLeft="1px solid"
          borderColor="neutral.300"
        >
          {filtered.map((tile) => (
            <ProductTile key={tile.name} {...tile} />
          ))}
        </SimpleGrid>
      ) : (
        <Text
          py="4rem"
          textAlign="center"
          textStyle="body-1"
          color="secondary.400"
        >
          No products match “{query}”.
        </Text>
      )}
    </>
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

export const CreatePageSuiteTab = (): JSX.Element => {
  return (
    <Box flex={1} overflow="auto" bg="neutral.100">
      <Container
        py={{ base: '2rem', md: '1rem' }}
        px={{ base: '1.5rem', md: '3.75rem' }}
        maxW="70rem"
      >
        <LauncherApps tiles={TILES} />
      </Container>
    </Box>
  )
}
