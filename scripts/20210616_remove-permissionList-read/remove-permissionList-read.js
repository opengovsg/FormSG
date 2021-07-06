/* eslint-disable */

// Number of forms with permissionList.read key - expect 0 after running update
db.forms.count({
  permissionList: { $elemMatch: { read: { $exists: true } } }
})

{
  // Number of objects in permissionList with read key - expect 0 after running update
  const permissionListWithReadKey = [
    {
      $match: {
        permissionList: { $elemMatch: { read: { $exists: true } } }
      },
    },
    { $project: { permissionList: 1 } },
    { $unwind: '$permissionList' },
    { $match: { 'permissionList.read': { $exists: true } } },
    { $count: 'numObjs' }
  ]

  db.getCollection('forms').aggregate(permissionListWithReadKey)
}

// Update - Remove read key
db.forms.update(
  { 'permissionList.read': { $exists: true } },
  { $unset: { 'permissionList.$[elem].read': 1 } },
  { arrayFilters: [{ 'elem.read': { $exists: true } }], multi: true }
)


// Check again, should be 0.
db.forms.count({
  permissionList: { $elemMatch: { read: { $exists: true } } }
})

// Check again, should be 0
{
  // Number of objects in permissionList with read key - expect 0 after running update
  const permissionListWithReadKey = [
    {
      $match: {
        permissionList: { $elemMatch: { read: { $exists: true } } }
      },
    },
    { $project: { permissionList: 1 } },
    { $unwind: '$permissionList' },
    { $match: { 'permissionList.read': { $exists: true } } },
    { $count: 'numObjs' }
  ]

  db.getCollection('forms').aggregate(permissionListWithReadKey)
}