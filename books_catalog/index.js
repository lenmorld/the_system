const express = require('express')
const server = express()

const { produceEvent } = require('./kafka/producer')
const { TOPIC_BOOKS } = require('./kafka/topics')

server.set('view engine', 'ejs');

server.use(express.static('public'))

// FIXME: to simplify, just use one admin user
const port = 4004

const USERS = [
    {
        id: 1,
        username: 'adminUser',
        name: 'Admin User',
        email: 'admin@example.com'
    }
]

// TODO: move to Redis or a DB
let BOOKS = [
    {
        id: 1,
        author: "Neil Pasricha",
        title: "The Happiness Equation",
        genre: "self-help",
    }, 
    {
        id: 2,
        author: "Paulo Coelho",
        title: "The Alchemist",
        genre: "fiction",
    },
    {
        id: 3,
        author: "Michael Ian Black",
        title: "You're Not Doing It Right",
        genre: "biography",
    }, 
]

server.get('/api/books', async (req, res) => {
    res.json({ books: BOOKS })
})

server.get('/', async (req, res) => {
    res.render('index', {
        books: JSON.stringify(BOOKS)
    })
})

server.delete('/books/:id', async (req, res) => {
    const id = Number(req.params.id)

    console.log("DELETE ", id)

    BOOKS = BOOKS.filter(book => book.id !== id)

    // TODO: Produce an event, format should be understood by consumer
    const user = USERS[0].username
    const events = {
        [user]: `Deleted book ${id}`
    }
    produceEvent(TOPIC_BOOKS, events)

    res.json(BOOKS)
})

server.listen(port, () => {
    console.log("stuff api listening at 4004")
})