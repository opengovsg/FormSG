import { useEffect, useMemo, useState } from 'react'
import { BiImage } from 'react-icons/bi'
import { Box, Flex, Icon, Image, Skeleton, Stack, Text } from '@chakra-ui/react'

interface FormBannerLogoInputProps {
  hasLogo: boolean
  logoImgSrc?: string
  logoImgAlt?: string
}

export const InvalidLogo = ({ message }: { message: string }): JSX.Element => {
  return (
    <Box bg="neutral.200" p="0.5rem">
      <Stack spacing="1rem" justify="center" align="center">
        <Icon as={BiImage} size="1.5rem" color="secondary.500" />
        <Text
          textStyle="caption-1"
          color="secondary.400"
          whiteSpace="pre-line"
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
}: FormBannerLogoInputProps): JSX.Element | null => {
  const [fallbackType, setFallbackType] = useState<
    'loading' | 'error' | 'loaded'
  >('loading')
  // Reset fallback type to `loading` whenever src changes.
  useEffect(() => {
    if (logoImgSrc) {
      setFallbackType('loading')
    }
  }, [logoImgSrc])

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

  if (!hasLogo) return null

  return (
    <Flex justify="center" p="1rem" bg="white">
      <Image
        fallback={fallback}
        onLoad={() => setFallbackType('loaded')}
        onError={() => setFallbackType('error')}
        src={logoImgSrc}
        alt={logoImgAlt}
        maxH="4rem"
      />
    </Flex>
  )
}
