import { useState } from 'react'
import { Flex, Image, Skeleton } from '@chakra-ui/react'

interface FormBannerLogoInputProps {
  hasLogo: boolean
  logoImgSrc?: string
  logoImgAlt?: string
  logoBg?: string
}

export const FormBannerLogo = ({
  hasLogo,
  logoImgSrc,
  logoImgAlt,
  logoBg = 'white',
}: FormBannerLogoInputProps): JSX.Element | null => {
  const [hasImageLoaded, setHasImageLoaded] = useState(false)

  if (!hasLogo) return null

  return (
    <Flex
      transition="background 0.2s ease"
      justify="center"
      p="1rem"
      bg={logoBg}
    >
      <Skeleton isLoaded={hasImageLoaded}>
        <Image
          onLoad={() => setHasImageLoaded(true)}
          ignoreFallback
          src={logoImgSrc}
          alt={logoImgAlt}
          // Define minimum height and width of skeleton before image has loaded.
          {...(hasImageLoaded ? {} : { h: '4rem', w: '4rem' })}
          maxH="4rem"
        />
      </Skeleton>
    </Flex>
  )
}
