/* global fetch, Headers */
require('isomorphic-fetch')

function Client (options) {
  if (!options.url) throw new Error('Missing url parameter')

  this.options = options
  this.url = options.url
  // A stack of registered listeners
  this.listeners = []
}

// to reduce file size
var proto = Client.prototype

/**
 * Send a query and get a Promise
 * @param   {String}   query
 * @param   {Object}   variables
 * @param   {Function} beforeRequest hook
 * @returns {Promise}
 */
proto.query = function (query, variables, beforeRequest) {
  var headers = new Headers()
  headers.set('content-type', 'application/json')

  var req = this.options.request || {}
  req.method || (req.method = 'POST')
  req.body || (req.body = JSON.stringify({
    query: query,
    variables: variables
  }))
  req.headers || (req.headers = headers)

  if (beforeRequest) {
    var result = beforeRequest(req)

    // The `beforeRequest` hook may redefine response when returning something
    if (typeof result !== 'undefined') {
      return Promise.resolve(result)
    }
  }

  return this.fetch(req)
}

/**
 * For making requests
 * @param   {Object} req
 * @returns Promise
 */
proto.fetch = function (req) {
  var self = this

  var results = self.trigger('request', [req])

  // The 'request' hook may redefine response when returning something
  for (var i = results.length; i--;) {
    if (typeof results[i] !== 'undefined') {
      return Promise.resolve(results[i])
    }
  }

  return fetch(self.url, req).then(function (res) {
    self.trigger('response', [res])
    return res.json()
  }).then(function (data) {
    self.trigger('data', [data])
    return data
  })
}

/**
 * Register a listener.
 * @param   {String}   eventName - 'request', 'response', 'data'
 * @param   {Function} callback
 * @returns Client instance
 */
proto.on = function (eventName, callback) {
  var allowedNames = ['request', 'response', 'data']

  if (~allowedNames.indexOf(eventName)) {
    this.listeners.push([ eventName, callback ])
  }

  return this
}

/**
 * Trigger an event.
 * @param   {String} eventName - 'request', 'response', 'data'
 * @param   {Array}  args
 * @returns {Array}  array of results received from each listener respectively
 */
proto.trigger = function (eventName, args) {
  var listeners = this.listeners
  var results = []

  for (var i = 0; i < listeners.length; i++) {
    if (listeners[i][0] === eventName) {
      results.push(listeners[i][1].apply(this, args))
    }
  }

  return results
}

module.exports = function (options) {
  return new Client(options)
}

module.exports.Client = Client
