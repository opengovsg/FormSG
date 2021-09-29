import { useCallback, useMemo, useState } from 'react'
import { Flex, Image, Skeleton } from '@chakra-ui/react'

import { FormLogoState } from '~shared/types/form/form_logo'

import { useEnv } from '~features/env/queries'
import { usePublicForm } from '~features/public-form/queries'

const useFormBannerLogo = () => {
  const [hasImageLoaded, setHasImageLoaded] = useState(false)

  const { data: form } = usePublicForm()
  const { data: { logoBucketUrl } = {} } = useEnv(
    form?.startPage.logo.state === FormLogoState.Custom,
  )

  const onImageLoad = useCallback(() => setHasImageLoaded(true), [])

  const logoImgSrc = useMemo(() => {
    if (!form) return undefined
    const formLogo = form.startPage.logo
    switch (formLogo.state) {
      case FormLogoState.None:
        return ''
      case FormLogoState.Default:
        return form.admin.agency.logo
      case FormLogoState.Custom:
        return logoBucketUrl ? `${logoBucketUrl}/${formLogo.fileId}` : undefined
    }
  }, [form, logoBucketUrl])

  const logoImgAlt = useMemo(
    () => (form ? `Logo for ${form.admin.agency.fullName}` : undefined),
    [form],
  )

  return {
    hasImageLoaded,
    onImageLoad,
    logoImgAlt,
    logoImgSrc,
  }
}

export const FormBannerLogo = (): JSX.Element => {
  const { hasImageLoaded, onImageLoad, logoImgAlt, logoImgSrc } =
    useFormBannerLogo()

  return (
    <Flex justify="center" p="1rem">
      <Skeleton isLoaded={hasImageLoaded}>
        <Image
          onLoad={onImageLoad}
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
