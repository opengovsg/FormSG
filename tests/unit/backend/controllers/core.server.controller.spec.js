const mongoose = require('mongoose')

const dbHandler = require('../helpers/db-handler')

describe('Core Controller', () => {
  // Declare global variables
  const Controller = spec(
    'dist/backend/app/controllers/core.server.controller',
    {
      mongoose: Object.assign(mongoose, { '@noCallThru': true }),
    },
  )

  let req
  let res

  beforeAll(async () => await dbHandler.connect())
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  beforeEach(() => {
    req = {
      query: {},
      params: {},
      body: {},
      session: {
        user: {
          _id: mongoose.Types.ObjectId('000000000001'),
          email: 'test@test.gov.sg',
        },
      },
      headers: {},
      ip: '127.0.0.1',
    }
    res = jasmine.createSpyObj('res', ['status', 'send', 'json'])
  })

  describe('index', () => {
    it('should render inject required environment variables', () => {
      res.render = jasmine.createSpy()
      Controller.index(req, res)
      expect(res.render).toHaveBeenCalledWith('index', {
        user: JSON.stringify(req.session.user),
      })
    })
  })
})
