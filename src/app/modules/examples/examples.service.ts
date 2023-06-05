import { get } from 'lodash'
import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import type { Except, Merge } from 'type-fest'

import { createLoggerWithLabel } from '../../config/logger'
import getFormModel from '../../models/form.server.model'
import getFormStatisticsTotalModel from '../../models/form_statistics_total.server.model'
import { DatabaseError } from '../core/core.errors'

import { MIN_SUB_COUNT, PAGE_SIZE } from './examples.constants'
import { ResultsNotFoundError } from './examples.errors'
import {
  lookupFormStatisticsInfo,
  projectSubmissionInfo,
  selectAndProjectCardInfo,
} from './examples.queries'
import {
  ExamplesQueryParams,
  FormInfo,
  QueryDataMap,
  QueryExecResult,
  QueryExecResultWithTotal,
  QueryPageResult,
  QueryPageResultWithTotal,
  RetrieveSubmissionsExecResult,
  SingleFormInfoQueryResult,
  SingleFormResult,
} from './examples.types'
import {
  createFormIdInfoPipeline,
  createGeneralQueryPipeline,
  createSearchQueryPipeline,
  createSingleSearchStatsPipeline,
  formatToRelativeString,
} from './examples.utils'

const FormModel = getFormModel(mongoose)
const FormStatisticsModel = getFormStatisticsTotalModel(mongoose)

const logger = createLoggerWithLabel(module)

/**
 * Creates and returns the query builder to execute some example fetch query.
 */
const getExamplesQueryBuilder = ({
  lookUpMiddleware,
  groupByMiddleware,
  generalQueryModel,
  query,
}: Merge<
  Except<QueryDataMap, 'singleSearchPipeline'>,
  { query: ExamplesQueryParams }
>): mongoose.Aggregate<unknown[]> => {
  const { agency, searchTerm } = query

  const modelToUse = searchTerm ? FormModel : generalQueryModel
  const pipeline = searchTerm
    ? createSearchQueryPipeline({
        minSubmissionCount: MIN_SUB_COUNT,
        searchTerm,
        agencyId: agency,
        lookUpMiddleware,
      })
    : createGeneralQueryPipeline({
        groupByMiddleware,
        minSubmissionCount: MIN_SUB_COUNT,
        agencyId: agency,
      })

  const queryBuilder = modelToUse
    .aggregate(pipeline)
    .read('secondary')
    // Prevent out-of-memory for large search results (max 100MB).
    .allowDiskUse(true)

  return queryBuilder
}

/**
 * Adds facet for retrieving total result counts to given query builder and
 * returns the execution result offset by the given offset value.
 * @param queryBuilder The query builder containing the query to execute
 * @param offset the value to offset the results by
 */
const execExamplesQueryWithTotal = (
  queryBuilder: mongoose.Aggregate<unknown[]>,
  offset: number,
): ResultAsync<QueryPageResultWithTotal, DatabaseError> => {
  return ResultAsync.fromPromise(
    queryBuilder
      .facet({
        pageResults: selectAndProjectCardInfo(
          /* limit= */ PAGE_SIZE,
          /* offset= */ offset,
        ),
        totalCount: [{ $count: 'count' }],
      })
      .exec(),
    (error) => {
      logger.error({
        message: 'Error in retrieving example forms',
        meta: {
          action: 'execExamplesQueryWithTotal',
        },
        error,
      })

      return new DatabaseError()
    },
  ).andThen((result) => {
    const [{ pageResults, totalCount }] = result as QueryExecResultWithTotal
    const formattedResults = pageResults.map((x) => ({
      ...x,
      timeText: formatToRelativeString(x.lastSubmission),
    }))
    const totalNumResults: number = get(totalCount, '[0].count') ?? 0
    return okAsync({ forms: formattedResults, totalNumResults })
  })
}

/**
 * Returns the execution result of the query inside the given query builder
 * offset by the given offset value.
 * @param queryBuilder The query builder containing the query to execute
 * @param offset the value to offset the results by
 */
const execExamplesQuery = (
  queryBuilder: mongoose.Aggregate<unknown[]>,
  offset: number,
): ResultAsync<QueryPageResult, DatabaseError> => {
  return ResultAsync.fromPromise(
    queryBuilder
      .append(
        selectAndProjectCardInfo(/* limit= */ PAGE_SIZE, /* offset= */ offset),
      )
      .exec() as Promise<QueryExecResult[]>,
    (error) => {
      logger.error({
        message: 'Error in retrieving example forms',
        meta: {
          action: 'execExamplesQuery',
        },
        error,
      })

      return new DatabaseError()
    },
  ).andThen((results) => {
    const formattedResults = results.map((x) => ({
      ...x,
      timeText: formatToRelativeString(x.lastSubmission),
    }))

    return okAsync({ forms: formattedResults })
  })
}

/**
 * Returns the relevant form information (formId, form title, agency logo and
 * color theme) of the given form id.
 * @param formId the id of the form to retrieve information for
 * @returns ok(form info) if form can be found in the database
 * @returns err(ResultsNotFoundError) if form cannot be found in the database
 * @returns err(DatabaseError) if error occurs whilst querying the database
 */
const getFormInfo = (
  formId: string,
): ResultAsync<FormInfo, DatabaseError | ResultsNotFoundError> => {
  const formIdInfoPipeline = createFormIdInfoPipeline(formId)

  return ResultAsync.fromPromise(
    FormModel.aggregate<FormInfo>(formIdInfoPipeline)
      .read('secondary')
      .allowDiskUse(true)
      .exec() as Promise<SingleFormInfoQueryResult>,
    (error) => {
      logger.error({
        message: 'Database error retrieving example form info',
        meta: {
          action: 'getFormInfo',
          formId,
        },
        error,
      })

      return new DatabaseError()
    },
  ).andThen((result) => {
    if (!result) {
      return errAsync(new ResultsNotFoundError('Invalid aggregation pipeline'))
    }
    const [retrievedFormInfo] = result
    // No form data retrieved inside result (formId likely invalid)
    if (!retrievedFormInfo) {
      return errAsync(
        new ResultsNotFoundError(
          'Error in retrieving template form - form not found.',
        ),
      )
    }

    return okAsync(retrievedFormInfo)
  })
}

/**
 * Retrieves example forms from either the FormStatisticsTotal aggregated
 * collection or from the Submissions collection via the given type parameter.
 * @param type the type of collection to retrieve from
 * @param query query parameters containing data to filter the retrieved examples forms.
 * @returns ok(object with list of retrieved example forms along with the total number of results) if `shouldGetTotalNumResults` is of string `"true"`
 * @returns ok(list of retrieved example forms) if `shouldGetTotalNumResults` is not of string `"true"`
 * @returns err(DatabaseError) if any errors occurs whilst running the pipeline on the database
 */
export const getExampleForms = (
  query: ExamplesQueryParams,
): ResultAsync<QueryPageResultWithTotal | QueryPageResult, DatabaseError> => {
  const queryBuilder = getExamplesQueryBuilder({
    query,
    lookUpMiddleware: lookupFormStatisticsInfo,
    groupByMiddleware: projectSubmissionInfo,
    generalQueryModel: FormStatisticsModel,
  })

  const { pageNo, shouldGetTotalNumResults } = query
  const offset = pageNo * PAGE_SIZE || 0

  return shouldGetTotalNumResults
    ? execExamplesQueryWithTotal(queryBuilder, offset)
    : execExamplesQuery(queryBuilder, offset)
}

/**
 * Retrieves a single form for examples from either the FormStatisticsTotal
 * aggregated collection or from the Submissions collection via the given type
 * parameter.
 * @param type the type of collection to retrieve from
 * @param formId the form id of the form to transform into an example response
 * @returns ok(example form info) if successful
 * @returns err(DatabaseError) if any errors occurs whilst running the pipeline on the database
 * @returns err(ResultsNotFoundError) if form info cannot be retrieved with the given form id
 */
export const getSingleExampleForm = (
  formId: string,
): ResultAsync<SingleFormResult, DatabaseError | ResultsNotFoundError> => {
  return (
    // Step 1: Retrieve base form info to augment.
    getFormInfo(formId)
      // Step 2a: Execute aggregate query with relevant single search pipeline.
      .andThen((formInfo) =>
        ResultAsync.fromPromise(
          FormStatisticsModel.aggregate(createSingleSearchStatsPipeline(formId))
            .read('secondary')
            .exec() as Promise<RetrieveSubmissionsExecResult>,
          (error) => {
            logger.error({
              message: 'Failed to retrieve a single example form',
              meta: {
                action: 'getSingleExampleForm',
              },
              error,
            })

            return new DatabaseError()
          },
          // Step 2b: Augment the initial base form info with the retrieved
          // statistics from the aggregate pipeline.
        ).map((queryResult) => {
          // Process result depending on whether search pipeline returned
          // results.
          // If the statistics cannot be found, add default "null" fields.
          if (!queryResult || queryResult.length === 0) {
            const emptyStatsExampleInfo: FormInfo = {
              ...formInfo,
              count: 0,
              lastSubmission: null,
              timeText: '-',
              avgFeedback: null,
            }
            return { form: emptyStatsExampleInfo }
          }

          // Statistics can be found.
          const [statistics] = queryResult
          const processedExampleInfo: FormInfo = {
            ...formInfo,
            count: statistics.count,
            lastSubmission: statistics.lastSubmission,
            avgFeedback: statistics.avgFeedback,
            timeText: formatToRelativeString(statistics.lastSubmission),
          }
          return { form: processedExampleInfo }
        }),
      )
  )
}
