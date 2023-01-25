const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');

const gql = require('graphql-tag')
const { faker } = require('@faker-js/faker');

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
  type Query {
    books: [Book]
  }    
`

const resolvers = {
    Book: {
        author: async parent => {
            const author = await knex("users")
                .select()
                .where("id", parent.authorId)
                .first()
            
            return author
        }
    },
    Query: {
        books: async () => {
            const books = await knex("books")
                .select()
                .limit(10)

            return books;
        }
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
        const server = new ApolloServer({ typeDefs, resolvers})

        const { url } = await startStandaloneServer(server, {
            listen: { port: 4001 }
        })

        // server.listen().then(({ url }) => {
        console.log(`🚀 Server ready at ${url}`)
        // })
    })