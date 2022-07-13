import { useCallback, useMemo, useState } from 'react'
import { BiLogOutCircle } from 'react-icons/bi'
import { Flex, Icon, Image, Skeleton, Text } from '@chakra-ui/react'

import { FormAuthType, FormLogoState } from '~shared/types'

import { BxsTimeFive } from '~assets/icons/BxsTimeFive'
import Button from '~components/Button'

import { useEnv } from '~features/env/queries'
import { useFormStartPageSettings } from '~features/public-form/components/FormStartPage/useFormStartPageSettings'

import { useCreateTabForm } from '../useCreateTabForm'
import { startPageDataSelector, useDesignStore } from '../useDesignStore'

export const StartPageView = () => {
  const [hasImageLoaded, setHasImageLoaded] = useState(false)
  const { data: form } = useCreateTabForm()
  const startPageFromStore = useDesignStore(startPageDataSelector)

  // Switch over to the store's start page once the drawer is loaded.
  const startPage = useMemo(
    () => (startPageFromStore ? startPageFromStore : form?.startPage),
    [startPageFromStore, form?.startPage],
  )

  // Color theme options and other design stuff, identical to public form
  const { titleColor, titleBg, estTimeString } =
    useFormStartPageSettings(startPage)

  const { data: { logoBucketUrl } = {} } = useEnv(
    startPage?.logo.state === FormLogoState.Custom,
  )

  const onImageLoad = useCallback(() => setHasImageLoaded(true), [])

  const logoImgSrc = useMemo(() => {
    if (!form) return undefined
    const formLogo = startPage?.logo
    switch (formLogo?.state) {
      case FormLogoState.None:
        return ''
      case FormLogoState.Default:
        return form.admin.agency.logo
      case FormLogoState.Custom:
        return logoBucketUrl ? `${logoBucketUrl}/${formLogo.fileId}` : undefined
    }
  }, [form, startPage, logoBucketUrl])

  const logoImgAlt = useMemo(
    () => (form ? `Logo for ${form.admin.agency.fullName}` : undefined),
    [form],
  )

  return (
    <>
      {startPage?.logo.state === FormLogoState.None ? null : (
        <Flex justify="center" p="1rem" bg="white">
          <Skeleton isLoaded={hasImageLoaded}>
            <Image
              onLoad={onImageLoad}
              ignoreFallback
              src={logoImgSrc}
              alt={logoImgAlt}
              // Define minimum height and width of skeleton before image has loaded.
              {...(hasImageLoaded ? {} : { h: '4rem', w: '4rem' })}
              maxH="4rem"
            />
          </Skeleton>
        </Flex>
      )}
      <Flex
        px={{ base: '1.5rem', md: '3rem' }}
        py={{ base: '2rem', md: '3rem' }}
        justify="center"
        bg={titleBg}
      >
        <Flex
          maxW="57rem"
          flexDir="column"
          align={{ base: 'start', md: 'center' }}
          color={titleColor}
        >
          <Skeleton isLoaded={!!form?.title}>
            <Text
              as="h1"
              textStyle="h1"
              textAlign={{ base: 'start', md: 'center' }}
            >
              {form?.title ?? 'Loading title'}
            </Text>
          </Skeleton>
          {estTimeString && (
            <Flex align="flex-start" justify="center" mt="0.875rem">
              <Icon as={BxsTimeFive} fontSize="1.5rem" mr="0.5rem" />
              <Text textStyle="body-2" mt="0.125rem">
                {estTimeString}
              </Text>
            </Flex>
          )}
          {form?.authType !== FormAuthType.NIL ? (
            <Button
              mt="2.25rem"
              variant="reverse"
              aria-label="User authentication ID"
              rightIcon={<BiLogOutCircle fontSize="1.5rem" />}
              isDisabled={true}
            >
              S8899000D - Log out
            </Button>
          ) : null}
        </Flex>
      </Flex>
    </>
  )
}
