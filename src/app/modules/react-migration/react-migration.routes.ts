import { Router } from 'express'

export const ReactMigrationRouter = Router()

const reactRolloutThreshold = 20 / 100

ReactMigrationRouter.get('/:formId([a-fA-F0-9]{24})', (req, res) => {
  // check cookies
  let serveReact

  if (req.cookies && 'frontend' in req.cookies) {
    serveReact = req.cookies.frontend === 'react'
  } else {
    serveReact = Math.random() < reactRolloutThreshold
  }

  res.cookie('frontend', serveReact ? 'react' : 'angular')

  if (serveReact) {
    // serve react
  } else {
    // serve angular
  }
})
