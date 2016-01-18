module.exports = function(params) {
  return {
    query: function(query, variables) {
      var headers = new Headers();
      headers.append("Content-Type", "application/json");

      return fetch(params.url, {
        method: "POST",
        body: JSON.stringify({
          query: query
        }),
        headers: headers
      }).then(function(res) {
        return res.json()
      })
    }
  }
}
