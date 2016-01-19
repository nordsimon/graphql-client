# Simple GraphQL Client
Small http client based on the fetch api. Uses isomorphic-fetch for wider support

If query fails, errors are thrown with messages and query highlight for easy debug

## Install
```javascript
npm install graphql-client -S
```

## How To
```javascript
var client = require('graphql-client')({url: 'http://your-host/graphql'})

var query = `
  query search ($query: String, $from: Int, $limit: Int) {
  search(query: $query, from: $from, limit: $limit) {
    took,
    totalHits,
    hits {
      name
    }
  }
}`

var variables = {
  query: "Search Query",
  limit: 100,
  from: 200
}

client.query(query, variables).then(function(body) {
  console.log(body)
})
.catch(function(err) {
  console.log(err.message)
})
```
