// Used for creating permissionList for test files more succinctly
let collabPermissions = { write: true }

module.exports.collaborator = (email) => {
  return Object.assign({ email }, collabPermissions)
}
