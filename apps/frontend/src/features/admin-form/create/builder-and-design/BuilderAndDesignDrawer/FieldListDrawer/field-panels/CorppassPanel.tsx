import { useTranslation } from 'react-i18next'

import {
  CREATE_CORPPASS_IDENTITY_DROP_ID,
  CREATE_CORPPASS_IDENTITY_FIELDS_ORDERED,
} from '~features/admin-form/create/builder-and-design/constants'

import {
  LoginIdentityFieldSection,
  LoginIdentityMessage,
} from './LoginIdentityFieldSection'

/** Laid out like the MyInfo panel: an info box, then the field section. */
export const CorppassFieldPanel = ({
  searchValue,
}: {
  searchValue: string
}): JSX.Element => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.sidebar.fields.loginIdentity',
  })
  return (
    <>
      <LoginIdentityMessage
        attrs={CREATE_CORPPASS_IDENTITY_FIELDS_ORDERED}
        loginName="Corppass"
        info={t('corppassPanelInfo')}
      />
      <LoginIdentityFieldSection
        attrs={CREATE_CORPPASS_IDENTITY_FIELDS_ORDERED}
        droppableId={CREATE_CORPPASS_IDENTITY_DROP_ID}
        searchValue={searchValue}
      />
    </>
  )
}
