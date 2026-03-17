export interface Payment {
  modal: {
    header: string
    body: string
    buttons: {
      cancel: string
      proceed: string
      submitting: string
    }
  }
  summary: {
    total: string
  }
  quantityModal: {
    header: string
    buttons: {
      update: string
      saving: string
      increment: string
      decrement: string
    }
    errors: {
      minQuantity: string
      wholeNumber: string
      maxQuantity: string
    }
  }
  productCard: {
    quantity: string
    change: string
  }
  error: {
    header: string
    body: string
    responseId: string
    ariaLabel: string
    ariaLabelNoTitle: string
  }
}

export { enSG } from './en-sg'
