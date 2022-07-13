import { useCallback, useEffect, useMemo, useState } from 'react'
import { Droppable } from 'react-beautiful-dnd'
import { BiLogOutCircle } from 'react-icons/bi'
import {
  Box,
  Flex,
  FlexProps,
  Icon,
  Image,
  Skeleton,
  Text,
} from '@chakra-ui/react'
import simplur from 'simplur'

import { FormAuthType, FormColorTheme, FormLogoState } from '~shared/types'

import { BxsTimeFive } from '~assets/icons/BxsTimeFive'
import Button from '~components/Button'

import { useEnv } from '~features/env/queries'

import { useCreatePageSidebar } from '../../common/CreatePageSidebarContext'
import { FIELD_LIST_DROP_ID } from '../constants'
import { DndPlaceholderProps } from '../types'
import {
  setToEditEndPageSelector,
  useBuilderAndDesignStore,
} from '../useBuilderAndDesignStore'
import { useCreateTabForm } from '../useCreateTabForm'
import {
  setStateSelector,
  startPageDataSelector,
  useDesignStore,
} from '../useDesignStore'

import { EmptyFormPlaceholder } from './BuilderAndDesignPlaceholder/EmptyFormPlaceholder'
import BuilderAndDesignPlaceholder from './BuilderAndDesignPlaceholder'
import { BuilderFields, useBuilderFields } from './BuilderFields'

const FormBuilderStartPage = () => {
  const [hasImageLoaded, setHasImageLoaded] = useState(false)
  const { data: form } = useCreateTabForm()
  const { startPageData, setState } = useDesignStore((state) => ({
    startPageData: startPageDataSelector(state),
    setState: setStateSelector(state),
  }))

  useEffect(() => {
    if (form) setState(form.startPage)
  }, [form, setState])

  // Color theme options and other design stuff, identical to public form

  const titleColour = useMemo(() => {
    if (startPageData.colorTheme === FormColorTheme.Orange) {
      return 'secondary.700'
    }
    return 'white'
  }, [startPageData.colorTheme])

  const titleBg = useMemo(
    () =>
      startPageData.colorTheme
        ? `theme-${startPageData.colorTheme}.500`
        : `neutral.200`,
    [startPageData.colorTheme],
  )

  const estTimeString = useMemo(() => {
    if (!startPageData.estTimeTaken) return ''
    return simplur`${startPageData.estTimeTaken} min[|s] estimated time to complete`
  }, [startPageData.estTimeTaken])

  //

  const { data: { logoBucketUrl } = {} } = useEnv(
    startPageData.logo.state === FormLogoState.Custom,
  )

  const onImageLoad = useCallback(() => setHasImageLoaded(true), [])

  const logoImgSrc = useMemo(() => {
    if (!form) return undefined
    const formLogo = startPageData?.logo
    switch (formLogo?.state) {
      case FormLogoState.None:
        return ''
      case FormLogoState.Default:
        return form.admin.agency.logo
      case FormLogoState.Custom:
        return logoBucketUrl ? `${logoBucketUrl}/${formLogo.fileId}` : undefined
    }
  }, [form, startPageData, logoBucketUrl])

  const logoImgAlt = useMemo(
    () => (form ? `Logo for ${form.admin.agency.fullName}` : undefined),
    [form],
  )

  return (
    <>
      {startPageData?.logo.state === FormLogoState.None ? null : (
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
          color={titleColour}
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

interface FormBuilderProps extends FlexProps {
  placeholderProps: DndPlaceholderProps
}

export const FormBuilder = ({
  placeholderProps,
  ...props
}: FormBuilderProps): JSX.Element => {
  const { builderFields } = useBuilderFields()
  const { handleBuilderClick } = useCreatePageSidebar()
  const setEditEndPage = useBuilderAndDesignStore(setToEditEndPageSelector)

  return (
    <Flex
      m={{ base: 0, md: '2rem' }}
      mb={0}
      flex={1}
      bg={{ base: 'secondary.100', md: 'primary.100' }}
      p={{ base: '1.5rem', md: '2.5rem' }}
      justify="center"
      overflow="auto"
      {...props}
    >
      <Flex flexDir="column" w="100%" maxW="57rem" h="fit-content">
        <FormBuilderStartPage />
        <Flex bg="white" p={{ base: 0, md: '2.5rem' }} flexDir="column">
          <Droppable droppableId={FIELD_LIST_DROP_ID}>
            {(provided, snapshot) =>
              builderFields?.length ? (
                <Box
                  pos="relative"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <BuilderFields
                    fields={builderFields}
                    isDraggingOver={snapshot.isDraggingOver}
                  />
                  {provided.placeholder}
                  <BuilderAndDesignPlaceholder
                    placeholderProps={placeholderProps}
                    isDraggingOver={snapshot.isDraggingOver}
                  />
                </Box>
              ) : (
                <EmptyFormPlaceholder
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  isDraggingOver={snapshot.isDraggingOver}
                  onClick={handleBuilderClick}
                />
              )
            }
          </Droppable>
        </Flex>
        <Button
          py="1.5rem"
          mt="1.5rem"
          variant="outline"
          borderColor="secondary.200"
          colorScheme="secondary"
          onClick={() => {
            setEditEndPage()
            handleBuilderClick()
          }}
        >
          <Text textStyle="subhead-2">Customise your Thank you page</Text>
        </Button>
      </Flex>
    </Flex>
  )
}
