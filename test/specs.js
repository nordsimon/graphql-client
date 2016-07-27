/* eslint-env mocha */
const { expect } = require('chai')
const { Client } = require('..')
const server = require('./lib/server')

const url = 'http://127.0.0.1:3099/graphql'

describe('GraphQL client', () => {
  let client

  before(() => {
    server.listen(3099)
  })

  after(() => {
    server.close()
  })

  beforeEach(() => {
    client = new Client({ url })
  })

  it('should query', () => {
    return client.query('{ user(id: "1") { id } }').then((data) => {
      expect(data).to.eql({ data: { user: { id: '1' } } })
    })
  })

  it('should register "request" and  "response" listeners', (done) => {
    let counter = 0
    client
      .on('request', function (req) {
        counter++
        expect(this).to.be.an.instanceof(Client)
        expect(req.method).to.equal('POST')
      })
      .on('response', (res) => {
        expect(counter).to.equal(2)
        expect(res.status).to.equal(200)

        res.text().then((text) => {
          expect(text).to.eql('{"data":{"user":{"id":"1"}}}')
          done()
        })
      })
      .on('request', (req) => { // 'request' once again
        counter++
        expect(req.method).to.equal('POST')
      })
      .query('{ user(id: "1") { id } }')
  })

  it('should register "error" listener', (done) => {
    client
      .on('response', (res) => {
        throw new Error('foo')
      })
      .on('error', (e) => {
        expect(e.message).to.equal('foo')
        done()
      })
      .query('{}')
  })

  it('should not throw on GraphQL error in response', (done) => {
    const timeout = setTimeout(() => {
      done()
    }, 1000)

    client.on('error', (e) => {
      clearTimeout(timeout)
      throw new Error('"error" event triggered')
    })
      .query('{}')
  })

  it('should modify req before querying', (done) => {
    let client = new Client({
      url,
      request: {
        method: 'GET',
        credentials: 'include'
      }
    })

    client.on('request', (req) => {
      expect(req.method).to.equal('GET')
      expect(req.credentials).to.equal('include')
      done()
    })
      .query('{}')
  })

  it('should modify req using `beforeRequest` function', (done) => {
    client.on('request', (req) => {
      expect(req.method).to.equal('GET')
      done()
    })
      .query('{}', null, function (req) {
        req.method = 'GET'
      })
  })
})