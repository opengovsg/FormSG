// Enum of actions that can be used to edit a form field
export enum EditFieldActions {
  Create = 'CREATE',
  Duplicate = 'DUPLICATE',
  Reorder = 'REORDER',
  Update = 'UPDATE',
  Delete = 'DELETE',
}

// Enum of date validation options
export enum DateSelectedValidation {
  NoPast = 'Disallow past dates',
  NoFuture = 'Disallow future dates',
  Custom = 'Custom date range',
}
