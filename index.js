module.exports = function (params) {
  require('isomorphic-fetch')
  if (!params.url) throw new Error('Missing url parameter')

  return {
    query: function (query, variables) {
      var headers = new Headers()
      headers.append('Content-Type', 'application/json')

      var req = {
        method: 'POST',
        body: JSON.stringify({
          query: query,
          variables: variables
        }),
        headers: headers,
        credentials: params.credentials
      }

      if (params.onRequest) params.onRequest(req)

      return fetch(params.url, req).then(function (res) {
        if (params.onResponse) params.onResponse(res)
        return res.json()
      }).then(function (data) {
        if (data.errors && data.errors.length) {
          console.error(data.errors.map(function (e) { return e.message }).join('\n') + '\n' + query)
        }
        return data
      })
    }
  }
}
