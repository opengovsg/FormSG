import { MouseEvent, useState } from 'react'
import { UseFormReturn, UseFormSetValue } from 'react-hook-form'
import { Box, Flex, Text } from '@chakra-ui/react'
import isEmail from 'validator/lib/isEmail'

import {
  BasicField,
  DropdownFieldBase,
  FormFieldDto,
  WorkflowType,
} from 'formsg-shared/types'

import Input from '~components/Input'
import { Tag, TagCloseButton } from '~components/Tag'

import { useAddFieldPicker } from '~features/admin-form/create/common/useAddFieldPicker'
import { EditStepInputs } from '~features/admin-form/create/workflow/types'
import { FormFieldWithQuestionNo } from '~features/form/types'

import { useIsWorkflowSavePermissive } from '../../../../hooks/useIsWorkflowSavePermissive'

import { ConditionalRoutingOption } from './Components/ConditionalRoutingOption'
import { FieldItem } from './Components/types'

interface Props {
  formMethods: UseFormReturn<EditStepInputs>
  isLoading: boolean
  emailFields: FieldItem[]
  dropdownFields: FormFieldWithQuestionNo<FormFieldDto<DropdownFieldBase>>[]
}

/** One source per person: direct addresses, an Email field, or a routing Dropdown. */
export const SingleRespondentInput = ({
  formMethods,
  isLoading,
  emailFields,
  dropdownFields,
}: Props) => {
  const {
    watch,
    setValue,
    register,
    formState: { errors },
  } = formMethods
  const isSavePermissive = useIsWorkflowSavePermissive()
  const addEmail = useAddFieldPicker({
    label: 'Add an Email field',
    fieldType: BasicField.Email,
  }).withAddFieldAction(() => undefined)
  const addDropdown = useAddFieldPicker({
    label: 'Add a Dropdown field',
    fieldType: BasicField.Dropdown,
  }).withAddFieldAction(() => undefined)
  const query = watch('respondent_query') ?? ''
  const setQuery = (value: string) =>
    setValue('respondent_query', value || undefined, { shouldDirty: true })
  const [isOpen, setIsOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const [error, setError] = useState('')
  const workflowType = watch('workflow_type')
  const emails = watch('emails') ?? []
  const fieldId = watch('field')
  const dropdownId = watch('conditional_field')
  const items = [
    ...emailFields.map((f) => ({
      ...f,
      type: WorkflowType.Dynamic,
      description: 'Email field',
    })),
    ...dropdownFields.map((f) => ({
      value: f._id,
      label: `${f.questionNumber}. ${f.title}`,
      type: WorkflowType.Conditional,
      description: 'Dropdown field',
    })),
  ]
  const choices = [
    ...items,
    {
      value: '__add_email__',
      label: 'Add an Email field',
      type: WorkflowType.Dynamic,
      description: 'Create a new form field',
    },
    {
      value: '__add_dropdown__',
      label: 'Add a Dropdown field',
      type: WorkflowType.Conditional,
      description: 'Create a new form field',
    },
  ]
  const filtered = choices.filter((item) =>
    `${item.label} ${item.description}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  )
  const selected = items.find(
    (item) =>
      item.type === workflowType &&
      item.value ===
        (workflowType === WorkflowType.Dynamic ? fieldId : dropdownId),
  )
  const write: UseFormSetValue<EditStepInputs> = (key, value) =>
    setValue(key, value, { shouldDirty: true, shouldValidate: true })
  const clear = () => {
    write('workflow_type', WorkflowType.Static)
    write('field', '')
    write('conditional_field', '')
    write('emails', [])
    setError('')
  }
  const choose = (item: (typeof items)[number]) => {
    if (item.value === '__add_email__' || item.value === '__add_dropdown__') {
      setIsOpen(false)
      if (item.value === '__add_email__') addEmail('__add_field__')
      else addDropdown('__add_field__')
      return
    }
    clear()
    write('workflow_type', item.type)
    if (item.type === WorkflowType.Dynamic) write('field', item.value)
    else write('conditional_field', item.value)
    setQuery('')
    setIsOpen(false)
  }
  const addEmails = () => {
    const next = query
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
    if (!next.length) return
    if (!next.every((email) => isEmail(email))) {
      setError('Enter valid email addresses, or choose a form field.')
      return
    }
    write('workflow_type', WorkflowType.Static)
    write('field', '')
    write('conditional_field', '')
    write('emails', Array.from(new Set([...emails, ...next])))
    setQuery('')
    setError('')
    setIsOpen(false)
  }
  register('workflow_type', {
    required: isSavePermissive ? false : 'Choose who should fill in this step.',
    validate: () =>
      !query.trim() ||
      'Finish entering an email address or choose a form field before saving.',
  })
  register('emails', {
    validate: (values) => {
      if (workflowType !== WorkflowType.Static) return true
      if (!isSavePermissive && !values?.length)
        return 'Enter at least one email address.'
      return (
        !values ||
        values.every((email) => isEmail(email)) ||
        'Enter valid email addresses.'
      )
    },
  })
  register('field', {
    validate: (value) =>
      workflowType !== WorkflowType.Dynamic ||
      emailFields.some((f) => f.value === value) ||
      'Choose an Email field.',
  })
  const errorMessage =
    error ||
    errors.workflow_type?.message ||
    errors.field?.message ||
    errors.emails?.message
  return (
    <Box position="relative">
      <Flex
        border="1px solid"
        borderColor={error ? 'danger.500' : 'secondary.300'}
        borderRadius="4px"
        p="0.5rem"
        gap="0.25rem"
        flexWrap="wrap"
        align="center"
        _focusWithin={{
          borderColor: 'primary.500',
          boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)',
        }}
      >
        {selected ? (
          <Tag colorScheme="secondary">
            {selected.label}
            <TagCloseButton
              aria-label="Clear selected respondent"
              isDisabled={isLoading}
              onClick={clear}
            />
          </Tag>
        ) : (
          emails.map((email) => (
            <Tag key={email} colorScheme="secondary">
              {email}
              <TagCloseButton
                aria-label={`Remove ${email}`}
                isDisabled={isLoading}
                onClick={() =>
                  write(
                    'emails',
                    emails.filter((value) => value !== email),
                  )
                }
              />
            </Tag>
          ))
        )}
        <Input
          role="combobox"
          aria-label="Email address, Email field or Dropdown field"
          aria-expanded={isOpen}
          aria-controls="respondent-source-options"
          aria-autocomplete="list"
          aria-activedescendant={
            isOpen && filtered[highlighted]
              ? `respondent-source-${highlighted}`
              : undefined
          }
          variant="unstyled"
          minW="12rem"
          flex="1"
          value={query}
          isDisabled={isLoading}
          placeholder={
            selected
              ? 'Change person source'
              : 'Type an email address or search for a field'
          }
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            setIsOpen(false)
            if (query.includes('@')) addEmails()
          }}
          onChange={(event) => {
            setQuery(event.target.value)
            setHighlighted(0)
            setIsOpen(true)
            setError('')
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setIsOpen(false)
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault()
              setIsOpen(true)
              setHighlighted((index) =>
                filtered.length
                  ? (index +
                      (event.key === 'ArrowDown' ? 1 : filtered.length - 1)) %
                    filtered.length
                  : 0,
              )
            }
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault()
              if (query.includes('@') || event.key === ',') addEmails()
              else if (filtered[highlighted]) choose(filtered[highlighted])
              else if (query)
                setError(
                  'Choose an Email or Dropdown field, or enter an email address.',
                )
            }
          }}
        />
      </Flex>
      {isOpen && !isLoading && (
        <Box
          id="respondent-source-options"
          role="listbox"
          aria-label="Respondent form fields"
          position="absolute"
          top="100%"
          left="0"
          right="0"
          bg="white"
          border="1px solid"
          borderColor="neutral.300"
          boxShadow="md"
          zIndex="dropdown"
          maxH="16rem"
          overflowY="auto"
        >
          {filtered.map((item, index) => (
            <Box
              as="button"
              type="button"
              role="option"
              id={`respondent-source-${index}`}
              aria-selected={index === highlighted}
              key={`${item.type}-${item.value}`}
              display="block"
              textAlign="left"
              w="100%"
              px="1rem"
              py="0.75rem"
              bg={index === highlighted ? 'primary.100' : 'white'}
              onMouseDown={(event: MouseEvent<HTMLButtonElement>) =>
                event.preventDefault()
              }
              onClick={() => choose(item)}
            >
              <Text>{item.label}</Text>
              <Text textStyle="body-2" color="secondary.400">
                {item.description}
              </Text>
            </Box>
          ))}
          {!filtered.length && (
            <Text p="1rem" color="secondary.400">
              {query.includes('@')
                ? 'Press Enter to add this email address'
                : 'No matching fields'}
            </Text>
          )}
        </Box>
      )}
      {errorMessage ? (
        <Text mt="0.5rem" textStyle="body-2" color="danger.500" role="alert">
          {errorMessage}
        </Text>
      ) : null}
      {workflowType === WorkflowType.Conditional && (
        <Box mt="0.75rem">
          <ConditionalRoutingOption
            selectedWorkflowType={workflowType}
            formMethods={formMethods}
            isLoading={isLoading}
            conditionalFormFields={dropdownFields}
            hideSelection
          />
        </Box>
      )}
    </Box>
  )
}
