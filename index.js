/* global fetch, Request */
require('isomorphic-fetch')

function Client (options) {
  var self = this

  if (!options.url) throw new Error('Missing url parameter')

  self.options = options
  self.url = options.url

  // Request instance that is used for `fetch`ing
  self.request = options.request instanceof Request
    ? options.request
    : new Request(self.url, options.request || { method: 'POST' })
  self.request.headers.append('content-type', 'application/json')

  // A stack of registered listeners
  self.listeners = []
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
  var self = this

  self.request.body = JSON.stringify({
    query: query,
    variables: variables
  })

  // 'beforeRequest' is a top priority per-query hook, it should forcibly
  // override response even from other hooks.
  var result = beforeRequest && beforeRequest(self.request)

  if (typeof result === 'undefined') {
    result = self.emit('request', self.request)

    // No 'response' hook here, reserve it for real responses only.

    // 'data' hook is only triggered if there are any data
    if (typeof result !== 'undefined') {
      var data = self.emit('data', result, true) // `true` for fake data
      if (typeof data !== 'undefined') result = data
    }
  }

  if (typeof result !== 'undefined') {
    result = Promise.resolve(result)
  }

  return result || self.fetch(self.request)
}

/**
 * For making requests
 * @param   {Object} req
 * @returns Promise
 */
proto.fetch = function (req) {
  var self = this

  return fetch(req).then(function (res) {
    // 'response' hook can redefine `res`
    var _res = self.emit('response', res)
    if (typeof _res !== 'undefined') res = _res

    return res.json()
  }).then(function (data) {
    // 'data' hook can redefine `data`
    var _data = self.emit('data', data)
    if (typeof _data !== 'undefined') data = _data

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
 * Emit an event.
 * @param   {String} eventName - 'request', 'response', 'data'
 * @param   {mixed}  ...args
 * @returns {Array}  array of results received from each listener respectively
 */
proto.emit = function (eventName) {
  var args = Array.prototype.slice.call(arguments, 1)
  var listeners = this.listeners
  var result

  // Triggering listeners and gettings latest result
  for (var i = 0; i < listeners.length; i++) {
    if (listeners[i][0] === eventName) {
      var r = listeners[i][1].apply(this, args)
      if (typeof r !== 'undefined') {
        result = r
      }
    }
  }

  return result
}

module.exports = function (options) {
  return new Client(options)
}

module.exports.Client = Client
