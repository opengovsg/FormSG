import { Router } from 'express'

export const PaymentsRouter = Router()

PaymentsRouter.get('/', (req, res) => res.json('ok'))
