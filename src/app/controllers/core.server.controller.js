/**
 * Renders root: '/'
 * @param  {Object} req - Express request object
 * @param  {Object} res - Express response object
 */
exports.index = function (req, res) {
  res.render('index', {
    user: JSON.stringify(req.session.user) || 'null',
  })
}
