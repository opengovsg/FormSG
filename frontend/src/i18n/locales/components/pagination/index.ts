export interface Pagination {
  paginationDesktop: {
    previousPage: string
    nextPage: string
  }
  paginationMobile: {
    previousPage: string
    nextPage: string
    currentPageCount: string
  }
}

export * from './en-sg'
