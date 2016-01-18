module.exports = function(url) {
  return {
    query: function(query, params) {
      var headers = new Headers();
      headers.append("Content-Type", "application/json");

      fetch(url, {
        method: "POST",
        body: JSON.stringify({
          query: bedQuery
        }),
        headers: myHeaders
      }).then(function(res) {
        return res.json()
      }).then(searchActions.receive)
    }
  }
}
