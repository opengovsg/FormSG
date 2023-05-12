import { useMemo } from 'react'
import { Droppable } from 'react-beautiful-dnd'
import { Box, Text } from '@chakra-ui/react'

import { AdminFormDto, FormAuthType, FormResponseMode } from '~shared/types'

import { GUIDE_EMAIL_MODE } from '~constants/links'
import InlineMessage from '~components/InlineMessage'
import Link from '~components/Link'

import {
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

import { useCreateTabForm } from '../../../../builder-and-design/useCreateTabForm'
import { DraggableMyInfoFieldListOption } from '../FieldListOption'

import { FieldSection } from './FieldSection'

export const MyInfoFieldPanel = () => {
  const { data: form, isLoading } = useCreateTabForm()
  // myInfo should be disabled if
  // 1. form response mode is not email mode
  // 2. form auth type is not myInfo
  // 3. # of myInfo fields >= 30
  const isMyInfoDisabled = useMemo(
    () =>
      form?.responseMode !== FormResponseMode.Email ||
      form?.authType !== FormAuthType.MyInfo ||
      (form ? form.form_fields.filter(isMyInfo).length >= 30 : true),
    [form],
  )
  const isDisabled = isMyInfoDisabled || isLoading

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
                  isDisabled={isDisabled}
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
                  isDisabled={isDisabled}
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
                    isDisabled={isDisabled}
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
                  isDisabled={isDisabled}
                  key={index}
                  fieldType={fieldType}
                />
              ))}
            </FieldSection>
            <Box display="none">{provided.placeholder}</Box>
          </Box>
        )}
      </Droppable>
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
  const isMyInfoDisabled = authType !== FormAuthType.MyInfo
  const numMyInfoFields = useMemo(
    () => form_fields.filter((ff) => isMyInfo(ff)).length,
    [form_fields],
  )

  if (responseMode !== FormResponseMode.Email) {
    return <Text>MyInfo fields are not available in Storage mode forms.</Text>
  }

  if (isMyInfoDisabled) {
    return (
      <Text>Enable MyInfo in the Settings tab to access these fields.</Text>
    )
  }

  return (
    <Text>
      {`Only 30 MyInfo fields are allowed in Email mode (${numMyInfoFields}/30).`}{' '}
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
