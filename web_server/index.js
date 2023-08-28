const path = require('path')
// const fetch = require('node-fetch')
const axios = require('axios')

const { request, gql } = require('graphql-request')

const express = require('express')

const { retryRequest } = require("./resiliency/retry")
const { CircuitBreaker } = require('./resiliency/circuit-breaker-opposum')
const { CircuitBreaker2, test } = require("./resiliency/circuit-breaker-home-baked")

// Kafka
const { consumeEvents } = require('./kafka/consumer')
const { TOPIC_BOOKS } = require('./kafka/topics')

const server = express()

const port = 4000

const Redis = require("ioredis");
const redis = new Redis(); // default 6379

const CACHE_KEY_BOOKS = "books"
const CACHE_KEY_BOOKS_CATALOG = "booksCatalog"

server.set('view engine', 'ejs');

server.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'))
})

// ========================
// CACHE demo
const fetchData = async () => {
    // const body = {a: 1};

    // const response = await fetch('https://httpbin.org/post', {
    //     method: 'post',
    //     body: JSON.stringify(body),
    //     headers: {
    //         'Content-Type': 'application/json', 
    //         'Accept': 'application/json',
    //     }
    // });

    // const response = await fetch('https://jsonplaceholder.typicode.com/users', {
    //     method: 'get',
    //     headers: {
    //         'Accept': 'application/json'
    //     }
    // })

    // const res = await response.json();

    // console.log(data);

    // const query = gql`
    // {
    //     company {
    //     ceo
    //     }
    //     roadster {
    //     apoapsis_au
    //     }
    // }
    // `

    // const res = await request('https://api.spacex.land/graphql/', query)

    // await redis.set("name", "Lenny")
    // console.log(await redis.get("name"))

    // check if in cache
    const booksCachedData = await redis.get(CACHE_KEY_BOOKS)

    let res;

    if (booksCachedData) {
        console.log("> cache hit!")
        res = JSON.parse(booksCachedData)
    } else {
        // fetch
        console.log("> cache miss! fetching data from books GraphQL server")

        const query = gql`
            {
                books {
                    id
                    title
                    author {
                        id
                        name
                    }
                }
            }
        `
        res = await request('http://localhost:4004', query)

        // save to cache
        redis.set(CACHE_KEY_BOOKS, JSON.stringify(res))
    }

    return res
}

server.get('/results', async (req, res) => {
    res.json(await fetchData())
})

// === end of CACHE demo ===
// =========================

// === KAFKA demo ====
// KAFKA, consume only once
// TODO: redis - clear cache
// FIXME: show in UI that there's an event
// websockets? push notification?

consumeEvents(TOPIC_BOOKS, (err, message) => {
    if (err) {
        console.error("consume event error: ", err)
        res.status(500).json({
            error: "consume event error: ", err
        })
    }

    const key = Buffer.from(message.key).toString()
    const value = Buffer.from(message.value).toString()

    // FIXME: put in a util, organize constants
    // invalidate cache of books catalog
    if (value.includes('Deleted')) {
        console.log("invalidate cache - books catalog")
        redis.del(CACHE_KEY_BOOKS_CATALOG)
    }

    console.log("event consumed: ", key, value)
})

server.get('/books', async (req, res) => {
    // cache the response
    // then invalidate when event is received that it's updated

    const booksCatalogCachedData = await redis.get(CACHE_KEY_BOOKS_CATALOG)

    let booksResponse = []

    if (booksCatalogCachedData) {
        console.log("✅ cache hit")
        booksResponse = JSON.parse(booksCatalogCachedData)
    } else {
        console.log("❌ cache miss")
        
        const response = await axios('http://localhost:4004/api/books')
        
        const books = response.data.books
        
        // save to cache
        console.log("💾 save to cache")
        redis.set(CACHE_KEY_BOOKS_CATALOG, JSON.stringify(books))

        booksResponse = books
    }

    res.render('books', {
        books: booksResponse,
    })
})

// === end of KAFKA demo

// =========================
// RETRY demo
server.get('/stuff', async (req, res) => {
    const maxRetries = 10
    const initialBackOffSeconds = 2000
    
    try {
        const resp = await retryRequest({
            url: 'http://localhost:4001/api2',
            method: 'GET'
        }, maxRetries, initialBackOffSeconds)
        res.json(resp)
    } catch (e) {
        // res.status(e.response.status).send(e.message)
        res.status(500).send(e.message)
    }
})
// ==== end of RETRY demo ==
// =========================

// =========================
// CIRCUIT BREAKER demo ====

server.get('/page', async (req, res) => {
    const request = {
        url: 'http://localhost:4003/api',
        method: 'GET'
    }

    try {
        // register request to Opposum CB
        const { fire } = CircuitBreaker(request)
        const data = await fire()
        console.log("success! results: ",  data)
        res.json(data)
    } catch (e) {
        console.error("client: ", e)
        res.send("error: " + e)
    }
})

// home-baked CB
server.get('/page2', async (req, res) => {
    // const request = {
    //     url: 'http://localhost:4003/api',
    //     method: 'GET'
    // }

    try {
        // const { fire } = CircuitBreaker2(request)
        // const data = await fire()
        // console.log("success! results: ",  data)
        const data = await test()
        res.json({ test: data})
    } catch (e) {
        console.error("client: ", e)
        res.send("error: " + e)
    }
})

// === end of CB demo ======
// =========================

server.listen(port, () => {
    console.log("web server listening at 4000")
})