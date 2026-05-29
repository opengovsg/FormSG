import { useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as ReactLink } from 'react-router-dom'
import { Box, Text } from '@chakra-ui/react'
import { useGrowthBook } from '@growthbook/growthbook-react'
import { Droppable } from '@hello-pangea/dnd'

import {
  AdminFormDto,
  FormAuthType,
  FormResponseMode,
  MyInfoAttribute,
} from 'formsg-shared/types'

import { GUIDE_MYINFO_BUILDER_FIELD } from '~constants/links'
import { ADMINFORM_SETTINGS_SINGPASS_SUBROUTE } from '~constants/routes'
import InlineMessage from '~components/InlineMessage'
import Link from '~components/Link'

import {
  CREATE_MYINFO_CHILDREN_DROP_ID,
  CREATE_MYINFO_CHILDREN_FIELDS_ORDERED,
  CREATE_MYINFO_CONTACT_DROP_ID,
  CREATE_MYINFO_CONTACT_FIELDS_ORDERED,
  CREATE_MYINFO_MARRIAGE_DROP_ID,
  CREATE_MYINFO_MARRIAGE_FIELDS_ORDERED,
  CREATE_MYINFO_PARTICULARS_DROP_ID,
  CREATE_MYINFO_PARTICULARS_FIELDS_ORDERED,
  CREATE_MYINFO_PERSONAL_DROP_ID,
  CREATE_MYINFO_PERSONAL_FIELDS_ORDERED,
} from '~features/admin-form/create/builder-and-design/constants'
import { MYINFO_FIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { isMyInfo } from '~features/myinfo/utils'
import { useUser } from '~features/user/queries'

import { useCreateTabForm } from '../../../../builder-and-design/useCreateTabForm'
import { DraggableMyInfoFieldListOption } from '../FieldListOption'

import { FieldSection } from './FieldSection'
import { filterFieldsBySearchValue } from './utils'

export const MyInfoFieldPanel = ({ searchValue }: { searchValue: string }) => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.sidebar.fields.myInfoPanel',
  })
  const { data: form, isLoading } = useCreateTabForm()

  const { user } = useUser()

  // FRM-1444: Remove once rollout is 100% and stable
  const growthbook = useGrowthBook()

  useEffect(() => {
    if (growthbook) {
      growthbook.setAttributes({
        // Only update the `adminEmail` and `adminAgency` attributes, keep the rest the same
        ...growthbook.getAttributes(),
        adminEmail: user?.email,
        adminAgency: user?.agency.shortName,
      })
    }
  }, [growthbook, user])

  /**
   * If sgID is used, checks if the corresponding
   * MyInfo field is supported by sgID.
   */
  // myInfo should be disabled if
  // 1. form auth type is not myInfo
  // 2. # of myInfo fields >= 30
  const isMyInfoDisabled = useMemo(
    () =>
      form
        ? form.form_fields.filter(isMyInfo).length >= 30 ||
          form.authType !== FormAuthType.MyInfo
        : true,
    [form],
  )
  const isDisabled = isMyInfoDisabled || isLoading
  const isDisabledCheck = useCallback(
    (fieldType: MyInfoAttribute): boolean => {
      return isDisabled
    },
    [isDisabled],
  )

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

  return (
    <>
      <MyInfoMessage />
      <Droppable isDropDisabled droppableId={CREATE_MYINFO_PERSONAL_DROP_ID}>
        {(provided) => (
          <Box ref={provided.innerRef} {...provided.droppableProps}>
            {filteredCreateMyInfoPersonalFields.length > 0 && (
              <FieldSection label={t('sections.personal')}>
                {filteredCreateMyInfoPersonalFields.map(
                  ({ fieldType, originalIndex }) => (
                    <DraggableMyInfoFieldListOption
                      index={originalIndex}
                      isDisabled={isDisabledCheck(fieldType)}
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
      <Droppable isDropDisabled droppableId={CREATE_MYINFO_CONTACT_DROP_ID}>
        {(provided) => (
          <Box ref={provided.innerRef} {...provided.droppableProps}>
            {filteredCreateMyInfoContactFields.length > 0 && (
              <FieldSection label={t('sections.contact')}>
                {filteredCreateMyInfoContactFields.map(
                  ({ fieldType, originalIndex }) => (
                    <DraggableMyInfoFieldListOption
                      index={originalIndex}
                      isDisabled={isDisabledCheck(fieldType)}
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
                      index={originalIndex}
                      isDisabled={isDisabledCheck(fieldType)}
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
                      index={originalIndex}
                      isDisabled={isDisabledCheck(fieldType)}
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
      {user?.betaFlags?.children &&
      form?.responseMode === FormResponseMode.Encrypt ? (
        <Droppable isDropDisabled droppableId={CREATE_MYINFO_CHILDREN_DROP_ID}>
          {(provided) => (
            <Box ref={provided.innerRef} {...provided.droppableProps}>
              {filteredCreateMyInfoChildrenFields.length > 0 && (
                <FieldSection label={t('sections.familyChildren')}>
                  {filteredCreateMyInfoChildrenFields.map(
                    ({ fieldType, originalIndex }) => (
                      <DraggableMyInfoFieldListOption
                        index={originalIndex}
                        isDisabled={isDisabledCheck(fieldType)}
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

type MyInfoTextProps = Pick<AdminFormDto, 'authType' | 'form_fields'>

const MyInfoText = ({
  authType,
  form_fields,
}: MyInfoTextProps): JSX.Element => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.sidebar.fields.myInfoPanel',
  })
  const isMyInfoDisabled = authType !== FormAuthType.MyInfo
  const numMyInfoFields = useMemo(
    () => form_fields.filter((ff) => isMyInfo(ff)).length,
    [form_fields],
  )

  if (isMyInfoDisabled) {
    return (
      <Text>
        {t('singpassDisabledBefore')}{' '}
        <Link as={ReactLink} to={ADMINFORM_SETTINGS_SINGPASS_SUBROUTE}>
          {t('singpassDisabledSettings')}
        </Link>{' '}
        {t('singpassDisabledAfter')}
      </Text>
    )
  }

  return (
    <Text>
      {t('myInfoFieldsLimit', { numMyInfoFields })}{' '}
      <Link isExternal href={GUIDE_MYINFO_BUILDER_FIELD}>
        {t('learnMore')}
      </Link>
    </Text>
  )
}

const MyInfoMessage = (): JSX.Element | null => {
  const { data: form } = useCreateTabForm()
  const numMyInfoFields = form?.form_fields.filter((ff) => isMyInfo(ff)).length
  const hasExceededLimit = useMemo(
    () => numMyInfoFields && numMyInfoFields >= 30,
    [numMyInfoFields],
  )

  return form ? (
    <Box px="1.5rem" pt="2rem" pb="1.5rem">
      <InlineMessage variant={hasExceededLimit ? 'error' : 'info'}>
        <MyInfoText {...form} />
      </InlineMessage>
    </Box>
  ) : null
}
