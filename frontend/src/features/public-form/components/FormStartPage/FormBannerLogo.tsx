import { useMemo } from 'react'
import { Flex, Image, Skeleton } from '@chakra-ui/react'

import { FormLogoState } from '~shared/types/form/form_logo'

import { useEnv } from '~features/env/queries'
import { usePublicForm } from '~features/public-form/queries'

export const FormBannerLogo = (): JSX.Element => {
  const { data, isLoading } = usePublicForm()
  const { data: { logoBucketUrl } = {} } = useEnv()

  const logoImgSrc = useMemo(() => {
    if (!data || !logoBucketUrl) return ''
    const formLogo = data.startPage.logo
    switch (formLogo.state) {
      case FormLogoState.None:
        return ''
      case FormLogoState.Default:
        return data.admin.agency.logo
      case FormLogoState.Custom:
        return `${logoBucketUrl}/${formLogo.fileId}`
    }
  }, [data, logoBucketUrl])

  const logoImgAlt = useMemo(
    () => (data ? `Logo for ${data.admin.agency.fullName}` : ''),
    [data],
  )

  return (
    <Flex justify="center" p="1rem">
      <Skeleton isLoaded={!isLoading}>
        <Image src={logoImgSrc} alt={logoImgAlt} maxH="4rem" />
      </Skeleton>
    </Flex>
  )
}
