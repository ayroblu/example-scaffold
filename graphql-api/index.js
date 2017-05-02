import express from 'express'
import graphQLHTTP from 'express-graphql'

import schema from './schema'
import loaders from './schema/loaders'
import mutators from './schema/mutators'

const app = express()

app.use(graphQLHTTP({
  schema
, context: {loaders, mutators}
, graphiql: true
}))

app.listen(5050)
