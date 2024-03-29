const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const DataLoader = require('dataloader');

const USE_DATA_LOADER_TO_RESOLVE_N_PLUS_1 = true

const gql = require('graphql-tag')
const { faker } = require('@faker-js/faker');

const MoviesAPI = require("./movies-api")

const knex = require('knex')({
    client: 'pg',
    connection: {
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'postgres',
        database: 'Library'
    }
})

const typeDefs = gql`
  type Author {
    id: ID!
    name: String!
  }
  type Book {
    id: ID!
    title: String
    author: Author!
  }
  type Movie {
    Title: String
  }
  type Query {
    books: [Book]
    movie(id: ID!): Movie
  }
`

const resolvers = {
    Book: {
        author: async (parent, _, ctx) => {
            if (USE_DATA_LOADER_TO_RESOLVE_N_PLUS_1) {
                return ctx.authorLoader.load(parent.authorId)
            }

            const author = await knex("users")
                .select()
                .where("id", parent.authorId)
                .first()
            
            return author
        }
    },
    Query: {
        // books: async () => {
        books: async (parent, args, contextValue, info) => {
            // console.log({ parent, args, contextValue, info })

            const books = await knex("books")
                .select()
                .limit(10)

            return books;
        },
        movie: async (_, { id }, { dataSources }) => {
            console.log({
                id
            })

            // return dataSources.moviesAPI.getMovie('tt0371746');
            return dataSources.moviesAPI.getMovie(id);
        },
    }
}

knex('users')
    .select()
    .limit(1)
    .catch(async err => {
        if (err.message.includes('"users" does not exist')) {
            await knex.schema.createTable('users', table => {
                table.increments("id")
                table.string("name")
            })

            await knex.schema.createTable("books", table => {
                table.increments("id")
                table.string("title")
                table.integer("authorId")
                // relationship
                table.foreign("authorId").references("users.id")
            })

            // fake users
            for (let i = 0; i<100; i++) {
                const ids = await knex("users").insert({
                    name: faker.name.fullName()
                }, ['id'])

                await knex("books").insert({
                    title: faker.company.name(),
                    authorId: ids[0].id 
                })
            }
        } else {
            throw err;
        }
    })
    .then(async () => {
        const server = new ApolloServer({ 
            typeDefs, 
            resolvers, 
        })

        const { url } = await startStandaloneServer(server, {
            listen: { port: 4009 },
            context: async () => {
                // use default InMemoryLRUCache
                const { cache } = server

                return {
                    // we create new instances of data source with each request,
                    // passing in our server's cache
                    dataSources: {
                        moviesAPI: new MoviesAPI({ cache })
                    },
                    // --- use DataLoader to resolve n+1 problem ---
                    // not used if !USE_DATA_LOADER_TO_RESOLVE_N_PLUS_1
                    authorLoader: new DataLoader(async keys => {
                        // keys are all the Book authorId
                        // console.log("DataLoader keys: ", keys)
        
                        const authors = await knex('users')
                            .select()
                            .whereIn("id", keys)
        
                        const authorMap = {}
                        authors.forEach(author => {
                            authorMap[author.id] = author
                        })
        
                        return keys.map(key => authorMap[key])
                    })
                    // ---------------------------------------------
                }
            }
        })

        // server.listen().then(({ url }) => {
        console.log(`🚀 Server ready at ${url}`)
        // })
    })