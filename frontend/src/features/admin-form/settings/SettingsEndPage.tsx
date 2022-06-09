import { useForm } from 'react-hook-form'
import { Flex } from '@chakra-ui/layout'
import { FormControl, Skeleton, Stack } from '@chakra-ui/react'

import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import Textarea from '~components/Textarea'

import { useAdminForm } from '../common/queries'

import { CategoryHeader } from './components/CategoryHeader'
import { useMutateFormSettings } from './mutations'

type SettingsInput = {
  title: string
  paragraph: string
  buttonText: string
  buttonLink: string
}

export const SettingsEndPage = (): JSX.Element => {
  const { data: form, isLoading } = useAdminForm()
  const { mutateFormEndPage } = useMutateFormSettings()

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<SettingsInput>({
    mode: 'onBlur',
    defaultValues: {
      title: form?.endPage.title ?? 'Thank you for filling out the form.',
      paragraph: form?.endPage.paragraph ?? '',
      buttonText: form?.endPage.buttonText ?? 'Submit another response',
      buttonLink: form?.endPage.buttonLink ?? '',
    },
  })

  const handleUpdateEndPage = handleSubmit((endPage) =>
    mutateFormEndPage.mutate(endPage),
  )

  return (
    <>
      <CategoryHeader mb={0} mr="2rem">
        Customise Thank You page
      </CategoryHeader>

      <Stack gap="2rem" paddingTop="2.5rem">
        <FormControl isInvalid={false}>
          <FormLabel isRequired>Title</FormLabel>
          <Skeleton isLoaded={!isLoading}>
            <Input
              // TODO (hans): Update Validation rules
              {...register('title')}
              onBlur={handleUpdateEndPage}
            />
          </Skeleton>
          <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
        </FormControl>
        <FormControl isInvalid={false}>
          <FormLabel isRequired>Follow-up paragraph</FormLabel>
          <Skeleton isLoaded={!isLoading}>
            <Textarea
              // TODO (hans): Update Validation rules
              {...register('paragraph')}
              onBlur={handleUpdateEndPage}
            />
          </Skeleton>
          <FormErrorMessage>{errors.paragraph?.message}</FormErrorMessage>
        </FormControl>
        <Flex gap="1rem">
          <FormControl isInvalid={false}>
            <FormLabel isRequired>Button text</FormLabel>
            <Skeleton isLoaded={!isLoading}>
              <Input
                // TODO (hans): Update Validation rules
                {...register('buttonText')}
                onBlur={handleUpdateEndPage}
              />
            </Skeleton>
            <FormErrorMessage>{errors.buttonText?.message}</FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={false}>
            <FormLabel isRequired>Button redirect link</FormLabel>
            <Skeleton isLoaded={!isLoading}>
              <Input
                // TODO (hans): Update Validation rules
                {...register('buttonLink')}
                placeholder="Default form link"
                onBlur={handleUpdateEndPage}
              />
            </Skeleton>
            <FormErrorMessage>{errors.buttonLink?.message}</FormErrorMessage>
          </FormControl>
        </Flex>
      </Stack>
    </>
  )
}
