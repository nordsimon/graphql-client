const http = require('http')
const schema = require('./schema')
const { graphql } = require('graphql')

module.exports = http.createServer((req, res) => {
  if (req.url === '/graphql') {
    let body = ''

    req.on('data', function (data) {
      body += data
    })

    req.on('end', function () {
      let query = body
      let variables
      let operationName

      if (~req.headers['content-type'].indexOf('application/json')) {
        try {
          const obj = JSON.parse(query)
          if (obj.query && typeof obj.query === 'string') {
            query = obj.query
          }
          if (obj.variables !== undefined) {
            variables = obj.variables
          }
          // Name of GraphQL operation to execute.
          if (typeof obj.operationName === 'string') {
            operationName = obj.operationName
          }
        } catch (err) {
          // do nothing
        }
      }

      res.writeHead(200, {'content-type': 'text/json'})

      graphql(schema, query, null, variables, operationName).then((result) => {
        let response = result

        if (result.errors) {
          res.statusCode = 400
          response = {
            errors: result.errors.map(String)
          }
        }

        res.end(JSON.stringify(response))
      }).catch((e) => {
        res.end(JSON.stringify(e))
      })
    })
  }
})
