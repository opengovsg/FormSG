import { get } from 'lodash'
import mongoose from 'mongoose'
import { okAsync, ResultAsync } from 'neverthrow'

import { IAgency, IForm, StartPage } from 'src/types'

import { createLoggerWithLabel } from '../../../config/logger'
import getFormStatisticsTotalModel from '../../models/form_statistics_total.server.model'
import getFormModel from '../../models/form.server.model'
import getSubmissionModel from '../../models/submission.server.model'
import { formatToRelativeString } from '../../utils/date'
import { DatabaseError } from '../core/core.errors'

import { MIN_SUB_COUNT, PAGE_SIZE } from './examples.constants'
import {
  groupSubmissionsByFormId,
  lookupFormStatisticsInfo,
  lookupSubmissionInfo,
  projectSubmissionInfo,
  selectAndProjectCardInfo,
} from './examples.queries'
import {
  createGeneralQueryPipeline,
  createSearchQueryPipeline,
} from './examples.utils'

const FormModel = getFormModel(mongoose)
const FormStatisticsModel = getFormStatisticsTotalModel(mongoose)
const SubmissionModel = getSubmissionModel(mongoose)

const logger = createLoggerWithLabel(module)

enum RetrievalType {
  Stats = 'statistics',
  Submissions = 'submissions',
}

type QueryData = {
  [k in RetrievalType]: {
    generalQueryModel: typeof FormStatisticsModel | typeof SubmissionModel
    lookUpMiddleware: Record<string, unknown>[]
    groupByMiddleware: Record<string, unknown>[]
  }
}

type QueryExecResult = {
  _id: string
  count: number
  lastSubmission: Date
  title: IForm['title']
  form_fields: IForm['form_fields']
  logo: IAgency['logo']
  agency: IAgency['shortName']
  colorTheme: StartPage['colorTheme']
  avgFeedback: number
}

type QueryExecResultWithTotal = {
  pageResults: QueryExecResult[]
  totalCount: {
    count: number
  }[]
}[]

type FormattedQueryExecResult = QueryExecResult & {
  timeText: string
}

type QueryPageResultWithTotal = {
  forms: FormattedQueryExecResult[]
  totalNumResults: number
}

type QueryParams =
  | {
      pageNo: string
      agency: string
      searchTerm?: string
      shouldGetTotalNumResults?: string
    }
  | Record<string, never>

/**
 * Maps retrieval type to the middlewares and query model used for general
 * queries to use when creating the aggregation pipeline
 */
const mapRetrievalToQueryData: QueryData = {
  [RetrievalType.Stats]: {
    generalQueryModel: FormStatisticsModel,
    lookUpMiddleware: lookupFormStatisticsInfo,
    groupByMiddleware: projectSubmissionInfo,
  },
  [RetrievalType.Submissions]: {
    generalQueryModel: SubmissionModel,
    lookUpMiddleware: lookupSubmissionInfo,
    groupByMiddleware: groupSubmissionsByFormId,
  },
}

/**
 * Creates and returns the query builder to execute some example fetch query.
 */
const getExamplesQueryBuilder = ({
  type,
  query = {},
}: {
  type: RetrievalType
  query: QueryParams
}): mongoose.Aggregate<unknown[]> => {
  const { agency, searchTerm } = query

  // Retrieve the appropriate middlewares.
  const {
    lookUpMiddleware,
    groupByMiddleware,
    generalQueryModel,
  } = mapRetrievalToQueryData[type]

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
    const totalNumResults: number = get(totalCount, '[0].count', 0)
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
): ResultAsync<QueryExecResult[], DatabaseError> => {
  return ResultAsync.fromPromise(
    queryBuilder
      .append(
        selectAndProjectCardInfo(/* limit= */ PAGE_SIZE, /* offset= */ offset),
      )
      .exec(),
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
    const pageResults = results as QueryExecResult[]
    const formattedResults = pageResults.map((x) => ({
      ...x,
      timeText: formatToRelativeString(x.lastSubmission),
    }))

    return okAsync(formattedResults)
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
export const getExamplesForm = ({
  type,
  query = {},
}: {
  type: RetrievalType
  query: QueryParams
}): ResultAsync<
  QueryPageResultWithTotal | QueryExecResult[],
  DatabaseError
> => {
  const queryBuilder = getExamplesQueryBuilder({ type, query })

  const { pageNo, shouldGetTotalNumResults } = query
  const offset = parseInt(pageNo) * PAGE_SIZE || 0

  return shouldGetTotalNumResults === 'true'
    ? execExamplesQueryWithTotal(queryBuilder, offset)
    : execExamplesQuery(queryBuilder, offset)
}
