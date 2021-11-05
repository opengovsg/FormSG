import { useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Box, Flex, Skeleton, Spacer, Stack, Text } from '@chakra-ui/react'

import { BasicField } from '~shared/types/field'
import { FormColorTheme } from '~shared/types/form/form'

import Button from '~components/Button'
import {
  AttachmentField,
  EmailField,
  HomeNoField,
  ImageField,
  NricField,
  NumberField,
  ParagraphField,
  RatingField,
  SectionField,
  ShortTextField,
  TableField,
  UenField,
  YesNoField,
} from '~templates/Field'
import { TableFieldSchema } from '~templates/Field/Table'

import { usePublicForm } from '~features/public-form/queries'

import { FormSectionsProvider } from './FormSectionsContext'
import { SectionSidebar } from './SectionSidebar'

export const FormFieldsContainer = (): JSX.Element => {
  const { data, isLoading } = usePublicForm()

  // TODO: Inject default values if field is MyInfo, or prefilled.
  const formMethods = useForm()

  const onSubmit = (values: Record<string, string>) => {
    console.log(values)
  }

  const bgColour = useMemo(() => {
    if (isLoading) return 'neutral.100'
    if (!data) return ''
    const { colorTheme } = data.startPage
    switch (colorTheme) {
      case FormColorTheme.Blue:
        return 'secondary.100'
      default:
        return `theme-${colorTheme}.100`
    }
  }, [data, isLoading])

  const renderFields = useMemo(() => {
    // Render skeleton when no data
    if (isLoading) {
      return (
        <Flex flexDir="column">
          <Skeleton height="2rem" />
          <Skeleton height="1.5rem" mt="2.25rem" />
          <Skeleton height="2.75rem" mt="0.75rem" />
          <Skeleton height="1.5rem" mt="2.25rem" />
          <Skeleton height="2.75rem" mt="0.75rem" />
          <Skeleton height="1.5rem" mt="2.25rem" />
          <Skeleton height="2.75rem" mt="0.75rem" />
          <Skeleton height="1.5rem" mt="2.25rem" />
          <Skeleton height="2.75rem" mt="0.75rem" />
        </Flex>
      )
    }

    return data?.form_fields.map((field) => {
      switch (field.fieldType) {
        case BasicField.Section:
          return (
            <SectionField
              key={field._id}
              dividerColor={bgColour}
              schema={field}
            />
          )
        case BasicField.Nric:
          return <NricField key={field._id} schema={field} />
        case BasicField.Number:
          return <NumberField key={field._id} schema={field} />
        case BasicField.ShortText:
          return <ShortTextField key={field._id} schema={field} />
        case BasicField.YesNo:
          return <YesNoField key={field._id} schema={field} />
        case BasicField.Uen:
          return <UenField key={field._id} schema={field} />
        case BasicField.Attachment:
          return <AttachmentField key={field._id} schema={field} />
        case BasicField.HomeNo:
          return <HomeNoField key={field._id} schema={field} />
        case BasicField.Statement:
          return <ParagraphField key={field._id} schema={field} />
        case BasicField.Rating:
          return <RatingField key={field._id} schema={field} />
        case BasicField.Email:
          return <EmailField key={field._id} schema={field} />
        case BasicField.Image:
          return <ImageField key={field._id} schema={field} />
        case BasicField.Table:
          return (
            <TableField key={field._id} schema={field as TableFieldSchema} />
          )
        default:
          return (
            <Text w="100%" key={field._id}>
              {JSON.stringify(field)}
            </Text>
          )
      }
    })
  }, [bgColour, data?.form_fields, isLoading])

  return (
    <FormSectionsProvider>
      <Flex bg={bgColour} flex={1} justify="center" p="1.5rem">
        <SectionSidebar />
        <FormProvider {...formMethods}>
          <Box bg="white" p="2.5rem" w="100%" minW={0} maxW="57rem">
            <form onSubmit={formMethods.handleSubmit(onSubmit)} noValidate>
              <Stack spacing="2.25rem">{renderFields}</Stack>
              <Button
                mt="1rem"
                type="submit"
                isLoading={formMethods.formState.isSubmitting}
                loadingText="Submitting"
              >
                Submit
              </Button>
            </form>
          </Box>
        </FormProvider>
        <Spacer />
      </Flex>
    </FormSectionsProvider>
  )
}
