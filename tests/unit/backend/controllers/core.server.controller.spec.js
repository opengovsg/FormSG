const mongoose = require('mongoose')

const dbHandler = require('../helpers/db-handler')
const User = dbHandler.makeModel('user.server.model', 'User')
const Agency = dbHandler.makeModel('agency.server.model', 'Agency')
const Submission = dbHandler.makeModel('submission.server.model', 'Submission')

describe('Core Controller', () => {
  // Declare global variables

  const testAgency = new Agency({
    shortName: 'govtest',
    fullName: 'Government Testing Agency',
    emailDomain: 'test.gov.sg',
    logo: '/invalid-path/test.jpg',
  })
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

  describe('userCount', () => {
    it('should return the number of users', (done) => {
      // Number of users to populate
      let numUsers = 30
      testAgency
        .save()
        .then(() => {
          let userPromises = _.times(numUsers, (time) =>
            new User({
              email: `user${time}@test.gov.sg`,
              agency: mongoose.Types.ObjectId(),
            }).save(),
          )
          return Promise.all(userPromises)
        })
        .then(() => {
          res.json.and.callFake(() => {
            expect(res.json).toHaveBeenCalledWith(numUsers)
            done()
          })
          Controller.userCount(req, res)
        })
        .catch(done)
    })
  })

  describe('submissionCount', () => {
    it('should return the number of submissions', (done) => {
      // Number of submissions to populate
      let numSubmissions = 300
      let submissionPromises = _.times(numSubmissions, () =>
        new Submission({ form: mongoose.Types.ObjectId() }).save(),
      )
      Promise.all(submissionPromises)
        .then(() => {
          res.json.and.callFake(() => {
            expect(res.json).toHaveBeenCalledWith(numSubmissions)
            done()
          })
          Controller.submissionCount(req, res)
        })
        .catch(done)
    })
  })
})
