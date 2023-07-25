import { useCallback, useMemo } from 'react'
import { Droppable } from 'react-beautiful-dnd'
import { Link as ReactLink } from 'react-router-dom'
import { Box, Text } from '@chakra-ui/react'

import {
  AdminFormDto,
  FormAuthType,
  FormResponseMode,
  MyInfoAttribute,
} from '~shared/types'

import { GUIDE_EMAIL_MODE } from '~constants/links'
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
import { isMyInfo } from '~features/myinfo/utils'
import { useUser } from '~features/user/queries'

import { useCreateTabForm } from '../../../../builder-and-design/useCreateTabForm'
import { DraggableMyInfoFieldListOption } from '../FieldListOption'

import { FieldSection } from './FieldSection'

const SGID_SUPPORTED: Set<MyInfoAttribute> = new Set([
  MyInfoAttribute.Name,
  MyInfoAttribute.DateOfBirth,
  MyInfoAttribute.PassportNumber,
  MyInfoAttribute.PassportExpiryDate,
  // This is disabled due to MyInfo and sgID-MyInfo not using the same
  // phone number formats.
  // MyInfoAttribute.MobileNo,
  // This is disabled due to slight different formatting.
  // We format the Myinfo response by separates lines in addresses with comma
  // Whereas sgID separates each line with newline.
  // MyInfoAttribute.RegisteredAddress,
])

/**
 * If sgID is used, checks if the corresponding
 * MyInfo field is supported by sgID.
 */
const sgIDUnSupported = (
  form: AdminFormDto | undefined,
  fieldType: MyInfoAttribute,
): boolean =>
  form?.authType === FormAuthType.SGID_MyInfo && !SGID_SUPPORTED.has(fieldType)

export const MyInfoFieldPanel = () => {
  const { data: form, isLoading } = useCreateTabForm()
  // myInfo should be disabled if
  // 1. form response mode is not email mode
  // 2. form auth type is not myInfo
  // 3. # of myInfo fields >= 30
  const isMyInfoDisabled = useMemo(
    () =>
      form
        ? form.form_fields.filter(isMyInfo).length >= 30 ||
          form.responseMode !== FormResponseMode.Email ||
          (form.authType !== FormAuthType.MyInfo &&
            form.authType !== FormAuthType.SGID_MyInfo)
        : true,
    [form],
  )
  const isDisabled = isMyInfoDisabled || isLoading
  const isDisabledCheck = useCallback(
    (fieldType: MyInfoAttribute): boolean => {
      return isDisabled || sgIDUnSupported(form, fieldType)
    },
    [form, isDisabled],
  )
  const { user } = useUser()

  return (
    <>
      <MyInfoMessage />
      <Droppable isDropDisabled droppableId={CREATE_MYINFO_PERSONAL_DROP_ID}>
        {(provided) => (
          <Box ref={provided.innerRef} {...provided.droppableProps}>
            <FieldSection label="Personal">
              {CREATE_MYINFO_PERSONAL_FIELDS_ORDERED.map((fieldType, index) => (
                <DraggableMyInfoFieldListOption
                  index={index}
                  isDisabled={isDisabledCheck(fieldType)}
                  key={index}
                  fieldType={fieldType}
                />
              ))}
            </FieldSection>
            <Box display="none">{provided.placeholder}</Box>
          </Box>
        )}
      </Droppable>
      <Droppable isDropDisabled droppableId={CREATE_MYINFO_CONTACT_DROP_ID}>
        {(provided) => (
          <Box ref={provided.innerRef} {...provided.droppableProps}>
            <FieldSection label="Contact">
              {CREATE_MYINFO_CONTACT_FIELDS_ORDERED.map((fieldType, index) => (
                <DraggableMyInfoFieldListOption
                  index={index}
                  isDisabled={isDisabledCheck(fieldType)}
                  key={index}
                  fieldType={fieldType}
                />
              ))}
            </FieldSection>
            <Box display="none">{provided.placeholder}</Box>
          </Box>
        )}
      </Droppable>
      <Droppable isDropDisabled droppableId={CREATE_MYINFO_PARTICULARS_DROP_ID}>
        {(provided) => (
          <Box ref={provided.innerRef} {...provided.droppableProps}>
            <FieldSection label="Particulars">
              {CREATE_MYINFO_PARTICULARS_FIELDS_ORDERED.map(
                (fieldType, index) => (
                  <DraggableMyInfoFieldListOption
                    index={index}
                    isDisabled={isDisabledCheck(fieldType)}
                    key={index}
                    fieldType={fieldType}
                  />
                ),
              )}
            </FieldSection>
            <Box display="none">{provided.placeholder}</Box>
          </Box>
        )}
      </Droppable>
      <Droppable isDropDisabled droppableId={CREATE_MYINFO_MARRIAGE_DROP_ID}>
        {(provided) => (
          <Box ref={provided.innerRef} {...provided.droppableProps}>
            <FieldSection label="Family (Marriage)">
              {CREATE_MYINFO_MARRIAGE_FIELDS_ORDERED.map((fieldType, index) => (
                <DraggableMyInfoFieldListOption
                  index={index}
                  isDisabled={isDisabledCheck(fieldType)}
                  key={index}
                  fieldType={fieldType}
                />
              ))}
            </FieldSection>
            <Box display="none">{provided.placeholder}</Box>
          </Box>
        )}
      </Droppable>
      {user?.betaFlags?.children ? (
        <Droppable isDropDisabled droppableId={CREATE_MYINFO_CHILDREN_DROP_ID}>
          {(provided) => (
            <Box ref={provided.innerRef} {...provided.droppableProps}>
              <FieldSection label="Family (Children)">
                {CREATE_MYINFO_CHILDREN_FIELDS_ORDERED.map(
                  (fieldType, index) => (
                    <DraggableMyInfoFieldListOption
                      index={index}
                      isDisabled={isDisabledCheck(fieldType)}
                      key={index}
                      fieldType={fieldType}
                    />
                  ),
                )}
              </FieldSection>
              <Box display="none">{provided.placeholder}</Box>
            </Box>
          )}
        </Droppable>
      ) : null}
    </>
  )
}

type MyInfoTextProps = Pick<
  AdminFormDto,
  'authType' | 'responseMode' | 'form_fields'
>

const MyInfoText = ({
  authType,
  responseMode,
  form_fields,
}: MyInfoTextProps): JSX.Element => {
  const isMyInfoDisabled =
    authType !== FormAuthType.MyInfo && authType !== FormAuthType.SGID_MyInfo
  const numMyInfoFields = useMemo(
    () => form_fields.filter((ff) => isMyInfo(ff)).length,
    [form_fields],
  )

  if (responseMode !== FormResponseMode.Email) {
    return <Text>MyInfo fields are not available in Storage mode forms.</Text>
  }

  if (isMyInfoDisabled) {
    return (
      <Text>
        Enable MyInfo in the{' '}
        <Link as={ReactLink} to={ADMINFORM_SETTINGS_SINGPASS_SUBROUTE}>
          Settings
        </Link>{' '}
        tab to access these fields.
      </Text>
    )
  }

  return (
    <Text>
      {authType === FormAuthType.SGID_MyInfo
        ? 'Some MyInfo fields are not yet supported in your selected authentication type. '
        : null}
      {`Only 30 MyInfo fields are allowed in Email mode (${numMyInfoFields}/30). `}
      <Link isExternal href={GUIDE_EMAIL_MODE}>
        Learn more
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
