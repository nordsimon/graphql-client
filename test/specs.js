/* eslint-env mocha */
/* global Request */
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

  it('should register "request" and "response" hooks', (done) => {
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

  it('should catch "error" initiated by "response" hook', (done) => {
    client
      .on('response', (res) => {
        throw new Error('foo')
      })
      .query('{}')
      .catch((e) => {
        expect(e.message).to.equal('foo')
        done()
      })
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

  it('should redefine `Request` instance before querying', (done) => {
    const request = new Request(url)
    request.headers.set('content-length', 3)

    const client = new Client({ url, request })

    client.on('request', (req) => {
      expect(req.method).to.equal('GET')
      expect(req.headers.get('content-type')).to.be.falsy
      expect(req.headers.get('content-length')).to.equal(3)
      done()
    })
      .query('{}')
  })

  it('should modify req using "beforeRequest" function', (done) => {
    client.on('request', (req) => {
      expect(req.method).to.equal('GET')
      done()
    })
      .query('{}', null, (req) => {
        req.method = 'GET'
      })
  })

  it('should redefine response through "beforeRequest" hook', () => {
    return client
      .query('{}', null, () => 'foo')
      .then((r) => expect(r).to.equal('foo'))
  })

  it('should redefine response using "request" hook', () => {
    return client
      .on('request', () => 'foo')
      .query('{}')
      .then((r) => expect(r).to.equal('foo'))
  })

  it('should redefine response using result from latest "request" hook', () => {
    return client
      .on('request', () => 'foo')
      .on('request', () => 'bar')
      .on('request', () => 'baz')
      .query('{}')
      .then((r) => expect(r).to.equal('baz'))
  })

  it('should redefine `data` using "data" hook', () => {
    return client
      .on('data', (data) => data.data)
      .query('{ user(id: "1") { id } }')
      .then((r) => expect(r).to.eql({ user: { id: '1' } }))
  })

  it('should redefine using both "res" and "data" hooks', () => {
    return client
      .on('request', () => 'foo')
      .on('data', (data) => (data += '-bar'))
      .query('{}')
      .then((r) => expect(r).to.eql('foo-bar'))
  })

  it('should redefine using "beforeRequest" and skipp other hooks', () => {
    return client
      // never triggers
      .on('request', (req) => 'baz')
      // never triggers
      .on('data', (data) => 'bar')
      // triggers
      .query('{}', null, (req) => 'foo')
      .then((r) => expect(r).to.eql('foo'))
  })
})
