const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString
} = require('graphql')

const data = [
  { id: '1', name: 'Dan' },
  { id: '2', name: 'Marie' },
  { id: '3', name: 'Jessie' }
]

const userType = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: { type: GraphQLString },
    name: { type: GraphQLString }
  }
})

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      user: {
        type: userType,
        args: {
          id: { type: GraphQLString }
        },
        resolve: (_, args) => data.find((u) => u.id === args.id)
      }
    }
  })
})

module.exports = schema
