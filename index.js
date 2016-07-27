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

  if (beforeRequest) beforeRequest(req)

  return this.fetch(req)
}

/**
 * For making requests
 * @param   {Object} req
 * @returns Promise
 */
proto.fetch = function (req) {
  var self = this

  self.trigger('request', [req])

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
 * @returns Client instance
 */
proto.trigger = function (eventName, args) {
  var listeners = this.listeners

  for (var i = 0; i < listeners.length; i++) {
    if (listeners[i][0] === eventName) {
      listeners[i][1].apply(this, args)
    }
  }

  return this
}

module.exports = function (options) {
  return new Client(options)
}

module.exports.Client = Client
