import { useTranslation } from 'react-i18next'
import { Box, Text, useDisclosure } from '@chakra-ui/react'
import { useFeatureIsOn } from '@growthbook/growthbook-react'
import { Droppable } from '@hello-pangea/dnd'

import { featureFlags } from 'formsg-shared/constants'
import { FormAuthType, FormResponseMode } from 'formsg-shared/types'

import { GUIDE_MYINFO_BUILDER_FIELD } from '~constants/links'
import InlineMessage from '~components/InlineMessage'
import Link from '~components/Link'

import {
  CREATE_MYINFO_CHILDREN_DROP_ID,
  CREATE_MYINFO_CHILDREN_FIELDS_ORDERED,
  CREATE_MYINFO_CONTACT_DROP_ID,
  CREATE_MYINFO_CONTACT_FIELDS_ORDERED,
  CREATE_MYINFO_IDENTITY_DROP_ID,
  CREATE_MYINFO_IDENTITY_FIELDS_ORDERED,
  CREATE_MYINFO_MARRIAGE_DROP_ID,
  CREATE_MYINFO_MARRIAGE_FIELDS_ORDERED,
  CREATE_MYINFO_PARTICULARS_DROP_ID,
  CREATE_MYINFO_PARTICULARS_FIELDS_ORDERED,
  CREATE_MYINFO_PERSONAL_DROP_ID,
  CREATE_MYINFO_PERSONAL_FIELDS_ORDERED,
} from '~features/admin-form/create/builder-and-design/constants'
import { MYINFO_FIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'

import { useCreateTabForm } from '../../../../builder-and-design/useCreateTabForm'
import { DraggableMyInfoFieldListOption } from '../FieldListOption'

import { FieldSection } from './FieldSection'
import { LoginFieldSetupModal } from './LoginFieldSetupModal'
import {
  LoginFieldLimitText,
  LoginIdentityFieldSection,
  SettingsLink,
} from './LoginIdentityFieldSection'
import { useFormUsesLogin } from './useFormUsesLogin'
import { useLoginFieldLimit } from './useLoginFieldLimit'
import { useOfferedLoginIdentityAttrs } from './useOfferedLoginIdentityAttrs'
import { filterFieldsBySearchValue } from './utils'

export const MyInfoFieldPanel = ({ searchValue }: { searchValue: string }) => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.sidebar.fields.myInfoPanel',
  })
  const { data: form, isLoading } = useCreateTabForm()

  const isMrfChildrenEnabled = useFeatureIsOn(featureFlags.mrfChildren)
  const isStorageChildrenEnabled = useFeatureIsOn(featureFlags.storageChildren)
  const offeredIdentityAttrs = useOfferedLoginIdentityAttrs(
    CREATE_MYINFO_IDENTITY_FIELDS_ORDERED,
    searchValue,
  )

  const showChildrenSection =
    (form?.responseMode === FormResponseMode.Encrypt &&
      isStorageChildrenEnabled) ||
    (form?.responseMode === FormResponseMode.Multirespondent &&
      isMrfChildrenEnabled)

  const { isAtLimit } = useLoginFieldLimit()
  const { usesLogin, setupDestination } = useFormUsesLogin()
  const setupModal = useDisclosure()
  const isLoginMissing = !usesLogin(FormAuthType.MyInfo)
  const isMyInfoDisabled =
    !form || (isLoginMissing && !setupDestination) || isAtLimit
  const setupProps = {
    isDragDisabled: isLoginMissing,
    onSetup: isLoginMissing && setupDestination ? setupModal.onOpen : undefined,
  }
  const isDisabled = isMyInfoDisabled || isLoading

  const filteredCreateMyInfoPersonalFields = filterFieldsBySearchValue(
    searchValue,
    CREATE_MYINFO_PERSONAL_FIELDS_ORDERED,
    MYINFO_FIELD_TO_DRAWER_META,
  )

  const filteredCreateMyInfoContactFields = filterFieldsBySearchValue(
    searchValue,
    CREATE_MYINFO_CONTACT_FIELDS_ORDERED,
    MYINFO_FIELD_TO_DRAWER_META,
  )

  const filteredCreateMyInfoParticularsFields = filterFieldsBySearchValue(
    searchValue,
    CREATE_MYINFO_PARTICULARS_FIELDS_ORDERED,
    MYINFO_FIELD_TO_DRAWER_META,
  )

  const filteredCreateMyInfoMarriageFields = filterFieldsBySearchValue(
    searchValue,
    CREATE_MYINFO_MARRIAGE_FIELDS_ORDERED,
    MYINFO_FIELD_TO_DRAWER_META,
  )

  const filteredCreateMyInfoChildrenFields = filterFieldsBySearchValue(
    searchValue,
    CREATE_MYINFO_CHILDREN_FIELDS_ORDERED,
    MYINFO_FIELD_TO_DRAWER_META,
  )

  const renderPersonalFields = (label?: string) => (
    <Droppable isDropDisabled droppableId={CREATE_MYINFO_PERSONAL_DROP_ID}>
      {(provided) => (
        <Box ref={provided.innerRef} {...provided.droppableProps}>
          {filteredCreateMyInfoPersonalFields.length > 0 && (
            <FieldSection label={label}>
              {filteredCreateMyInfoPersonalFields.map(
                ({ fieldType, originalIndex }) => (
                  <DraggableMyInfoFieldListOption
                    {...setupProps}
                    index={originalIndex}
                    isDisabled={isDisabled}
                    key={originalIndex}
                    fieldType={fieldType}
                  />
                ),
              )}
            </FieldSection>
          )}
          <Box display="none">{provided.placeholder}</Box>
        </Box>
      )}
    </Droppable>
  )

  return (
    <>
      {setupModal.isOpen && setupDestination && (
        <LoginFieldSetupModal
          loginName="Singpass"
          destination={setupDestination}
          onClose={setupModal.onClose}
        />
      )}
      <MyInfoMessage />
      {/* Without identity options, keep the original Personal section layout. */}
      {offeredIdentityAttrs.length > 0 ? (
        <FieldSection label={t('sections.personal')}>
          <LoginIdentityFieldSection
            attrs={CREATE_MYINFO_IDENTITY_FIELDS_ORDERED}
            droppableId={CREATE_MYINFO_IDENTITY_DROP_ID}
            searchValue={searchValue}
            withSectionLabel={false}
          />
          {renderPersonalFields()}
        </FieldSection>
      ) : (
        renderPersonalFields(t('sections.personal'))
      )}
      <Droppable isDropDisabled droppableId={CREATE_MYINFO_CONTACT_DROP_ID}>
        {(provided) => (
          <Box ref={provided.innerRef} {...provided.droppableProps}>
            {filteredCreateMyInfoContactFields.length > 0 && (
              <FieldSection label={t('sections.contact')}>
                {filteredCreateMyInfoContactFields.map(
                  ({ fieldType, originalIndex }) => (
                    <DraggableMyInfoFieldListOption
                      {...setupProps}
                      index={originalIndex}
                      isDisabled={isDisabled}
                      key={originalIndex}
                      fieldType={fieldType}
                    />
                  ),
                )}
              </FieldSection>
            )}
            <Box display="none">{provided.placeholder}</Box>
          </Box>
        )}
      </Droppable>
      <Droppable isDropDisabled droppableId={CREATE_MYINFO_PARTICULARS_DROP_ID}>
        {(provided) => (
          <Box ref={provided.innerRef} {...provided.droppableProps}>
            {filteredCreateMyInfoParticularsFields.length > 0 && (
              <FieldSection label={t('sections.particulars')}>
                {filteredCreateMyInfoParticularsFields.map(
                  ({ fieldType, originalIndex }) => (
                    <DraggableMyInfoFieldListOption
                      {...setupProps}
                      index={originalIndex}
                      isDisabled={isDisabled}
                      key={originalIndex}
                      fieldType={fieldType}
                    />
                  ),
                )}
              </FieldSection>
            )}
            <Box display="none">{provided.placeholder}</Box>
          </Box>
        )}
      </Droppable>
      <Droppable isDropDisabled droppableId={CREATE_MYINFO_MARRIAGE_DROP_ID}>
        {(provided) => (
          <Box ref={provided.innerRef} {...provided.droppableProps}>
            {filteredCreateMyInfoMarriageFields.length > 0 && (
              <FieldSection label={t('sections.familyMarriage')}>
                {filteredCreateMyInfoMarriageFields.map(
                  ({ fieldType, originalIndex }) => (
                    <DraggableMyInfoFieldListOption
                      {...setupProps}
                      index={originalIndex}
                      isDisabled={isDisabled}
                      key={originalIndex}
                      fieldType={fieldType}
                    />
                  ),
                )}
              </FieldSection>
            )}
            <Box display="none">{provided.placeholder}</Box>
          </Box>
        )}
      </Droppable>
      {showChildrenSection ? (
        <Droppable isDropDisabled droppableId={CREATE_MYINFO_CHILDREN_DROP_ID}>
          {(provided) => (
            <Box ref={provided.innerRef} {...provided.droppableProps}>
              {filteredCreateMyInfoChildrenFields.length > 0 && (
                <FieldSection label={t('sections.familyChildren')}>
                  {filteredCreateMyInfoChildrenFields.map(
                    ({ fieldType, originalIndex }) => (
                      <DraggableMyInfoFieldListOption
                        {...setupProps}
                        index={originalIndex}
                        isDisabled={isDisabled}
                        key={originalIndex}
                        fieldType={fieldType}
                      />
                    ),
                  )}
                </FieldSection>
              )}
              <Box display="none">{provided.placeholder}</Box>
            </Box>
          )}
        </Droppable>
      ) : null}
    </>
  )
}

const MyInfoText = ({
  isSingpassUsed,
}: {
  isSingpassUsed: boolean
}): JSX.Element => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.sidebar.fields.myInfoPanel',
  })

  const { setupDestination } = useFormUsesLogin()
  const { t: tLogin } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.sidebar.fields.loginIdentity.setup',
  })
  if (!isSingpassUsed && setupDestination) {
    return <Text>{tLogin('chooseField', { loginName: 'Singpass' })}</Text>
  }

  if (!isSingpassUsed) {
    return (
      <Text>
        {t('singpassDisabledBefore')}{' '}
        <SettingsLink>{t('singpassDisabledSettings')}</SettingsLink>{' '}
        {t('singpassDisabledAfter')}
      </Text>
    )
  }

  return (
    <Text>
      <LoginFieldLimitText />{' '}
      <Link isExternal href={GUIDE_MYINFO_BUILDER_FIELD}>
        {t('learnMore')}
      </Link>
    </Text>
  )
}

const MyInfoMessage = (): JSX.Element | null => {
  const { data: form } = useCreateTabForm()
  const { isAtLimit } = useLoginFieldLimit()
  const { usesLogin } = useFormUsesLogin()
  const isSingpassUsed = usesLogin(FormAuthType.MyInfo)

  return form ? (
    <Box px="1.5rem" pt="2rem" pb="1.5rem">
      <InlineMessage variant={isAtLimit && isSingpassUsed ? 'error' : 'info'}>
        <MyInfoText isSingpassUsed={isSingpassUsed} />
      </InlineMessage>
    </Box>
  ) : null
}
