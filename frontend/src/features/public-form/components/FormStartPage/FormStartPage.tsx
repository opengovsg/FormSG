import { useCallback, useMemo } from 'react'
import { Waypoint } from 'react-waypoint'
import { useDisclosure } from '@chakra-ui/react'

import { FormAuthType } from '~shared/types'

import { usePublicAuthMutations } from '~features/public-form/mutations'
import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { FormBannerLogo } from './FormBannerLogo'
import { FormHeader, MiniHeader } from './FormHeader'
import { useFormBannerLogo } from './useFormBannerLogo'
import { useFormHeader } from './useFormHeader'

export const FormStartPage = (): JSX.Element => {
  const { form, spcpSession, formId, submissionData, miniHeaderRef } =
    usePublicFormContext()
  const { handleLogoutMutation } = usePublicAuthMutations(formId)

  const formBannerLogoProps = useFormBannerLogo(form)

  const title = useMemo(() => form?.title, [form?.title])
  const { titleColor, titleBg, estTimeString } = useFormHeader(form?.startPage)
  const showHeader = !submissionData

  const handleLogout = useCallback(() => {
    if (!form || form?.authType === FormAuthType.NIL) return
    return handleLogoutMutation.mutate(form.authType)
  }, [form, handleLogoutMutation])

  // For Mini Header
  const { isOpen, onOpen, onClose } = useDisclosure()

  const handlePositionChange = useCallback(
    (pos: Waypoint.CallbackArgs) => {
      // Required so a page that loads in the middle of the page can still
      // trigger the mini header.
      if (pos.currentPosition === 'above') {
        onOpen()
      } else {
        onClose()
      }
    },
    [onClose, onOpen],
  )

  return (
    <>
      <FormBannerLogo {...formBannerLogoProps} />
      <MiniHeader
        title={title}
        titleBg={titleBg}
        titleColor={titleColor}
        showHeader={showHeader}
        miniHeaderRef={miniHeaderRef}
        isOpen={isOpen}
      />
      <FormHeader
        title={form?.title}
        estTimeString={estTimeString}
        titleBg={titleBg}
        titleColor={titleColor}
        showHeader={showHeader}
        loggedInId={spcpSession?.userName}
        miniHeaderRef={miniHeaderRef}
        handleLogout={handleLogout}
      />
      {/* Sentinel to know when sticky navbar is starting */}
      <Waypoint topOffset="64px" onPositionChange={handlePositionChange} />
    </>
  )
}
