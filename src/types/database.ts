// General types used across database models.

export interface PublicView<T> {
  getPublicView(): T
}

// The returned object from updateMany
// Refer here: https://mongoosejs.com/docs/api/model.html#model_Model.updateMany
export interface UpdateManyMeta {
  n: number
  nModified: number
  ok: number
}
