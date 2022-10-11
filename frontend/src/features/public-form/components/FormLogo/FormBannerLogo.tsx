import { useEffect, useMemo, useState } from 'react'
import { BiImage } from 'react-icons/bi'
import {
  Box,
  Flex,
  Grid,
  Icon,
  Image,
  Skeleton,
  Spacer,
  Stack,
  Text,
} from '@chakra-ui/react'

import { FormColorTheme } from '~shared/types'

import { FormLogoutButton } from './FormLogoutButton'

export interface FormBannerLogoProps {
  hasLogo: boolean
  logoImgSrc?: string
  logoImgAlt?: string
  colorTheme: FormColorTheme
  /**
   * id of currently logged in user.
   * If not provided, logout button will be hidden.
   */
  loggedInId?: string
  onLogout: (() => void) | undefined
  isLoading: boolean
}

export const InvalidLogo = ({ message }: { message: string }): JSX.Element => {
  return (
    <Box bg="neutral.200" p="0.5rem">
      <Stack spacing="1rem" justify="center" align="center">
        <Icon as={BiImage} size="1.5rem" color="secondary.500" />
        <Text
          textStyle="caption-1"
          color="secondary.400"
          whiteSpace="pre-wrap"
          textAlign="center"
        >
          {message}
        </Text>
      </Stack>
    </Box>
  )
}

export const FormBannerLogo = ({
  hasLogo,
  logoImgSrc,
  logoImgAlt,
  loggedInId,
  onLogout,
  colorTheme,
  isLoading,
}: FormBannerLogoProps): JSX.Element | null => {
  const [fallbackType, setFallbackType] = useState<
    'loading' | 'error' | 'loaded'
  >('loading')
  // Reset fallback type to `loading` whenever src changes.
  useEffect(() => {
    if (logoImgSrc || isLoading) {
      setFallbackType('loading')
    }
  }, [isLoading, logoImgSrc])

  const fallback = useMemo(() => {
    if (!logoImgSrc && fallbackType !== 'loading') {
      return <InvalidLogo message="Image not provided" />
    }
    if (fallbackType === 'error') {
      return <InvalidLogo message="Image not found" />
    }
    if (fallbackType !== 'loaded') {
      return <Skeleton h="4rem" w="4rem" />
    }
  }, [fallbackType, logoImgSrc])

  if (!hasLogo && !isLoading) return null

  return (
    <Grid p="1rem" bg="white" gridTemplateColumns="1fr auto 1fr">
      <Spacer />
      <Flex maxW="57rem">
        <Image
          fallback={fallback}
          onLoad={() => setFallbackType('loaded')}
          onError={() => setFallbackType('error')}
          src={logoImgSrc}
          alt={logoImgAlt}
          minH="1.25rem"
          maxH="4rem"
        />
      </Flex>
      <FormLogoutButton
        colorScheme={`theme-${colorTheme}`}
        loggedInId={loggedInId}
        onLogout={onLogout}
      />
    </Grid>
  )
}
