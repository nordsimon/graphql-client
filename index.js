module.exports = function(params) {
  require('isomorphic-fetch');
  if(!params.url) throw new Error("Missing url parameter")

  return {
    query: function(query, variables) {
      var headers = new Headers();
      headers.append("Content-Type", "application/json");

      return fetch(params.url, {
        method: "POST",
        body: JSON.stringify({
          query: query,
          variables: variables
        }),
        headers: headers
      }).then(function(res) {
        return res.json()
      })
    }
  }
}
