function highlightQuery (query, errors) {
  var locations = errors.map(function (e) { return e.locations })
    .reduce(function (a, b) {
      return a.concat(b)
    }, [])

  var queryHighlight = ''

  query.split('\n').forEach(function (row, index) {
    var line = index + 1
    var lineErrors = locations.filter(function (loc) { return loc.line === line })

    queryHighlight += row + '\n'

    if (lineErrors.length) {
      var errorHighlight = []

      lineErrors.forEach(function (line) {
        for (var i = 0; i < 8; i++) {
          errorHighlight[line.column + i] = '~'
        }
      })

      for (var i = 0; i < errorHighlight.length; i++) {
        queryHighlight += errorHighlight[i] || ' '
      }
      queryHighlight += '\n'
    }
  })

  return queryHighlight
}

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
          throw new Error(data.errors.map(function (e) { return e.message }).join('\n') + '\n' + highlightQuery(query, data.errors))
        }
        return data
      })
    }
  }
}
