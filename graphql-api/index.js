import express from 'express'
import graphQLHTTP from 'express-graphql'

import schema from './schema'
import loaders from './schema/loaders'

const app = express()

app.use(graphQLHTTP({
  schema
, context: {loaders}
, graphiql: true
}))

app.listen(5050)
