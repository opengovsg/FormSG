export type WorkerState = WorkerSuccessStates | WorkerErrorStates
export enum WorkerSuccessStates {
  Success = 'Success',
}

export enum WorkerErrorStates {
  AttachmentDownloadError = 'Attachment Download Error',
  UnverifiedSignatureError = 'Unverified Signature Error',
  ParsingError = 'Parsing Error',
  DecryptionError = 'Decryption Error',
  InitializationError = 'Initialization Error',
}

export interface IResponseWorker<TRequest, TResponse> extends Worker {
  postMessage: (message: TResponse) => void
  onmessage: (message: MessageEvent<TRequest>) => void
}

export interface WorkerError {
  status: WorkerErrorStates
  message?: string
}
