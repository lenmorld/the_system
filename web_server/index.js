const path = require('path')
// const fetch = require('node-fetch')
const axios = require('axios')

const { request, gql } = require('graphql-request')

const express = require('express')

const { retryRequest } = require("./resiliency/retry")
// const { CircuitBreaker } = require("./resiliency/circuit-breaker")
// const { fire } = require('../resiliency/circuit-breaker-opposum')
const { CircuitBreaker, fire, breakers } = require('./resiliency/circuit-breaker-opposum')

const server = express()

const port = 4000

const Redis = require("ioredis");
const redis = new Redis(); // default 6379

const CACHE_KEY_BOOKS = "books"

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
        res = await request('http://localhost:4001', query)

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

server.get('/page2', async (req, res) => {
    const request = {
        url: 'http://localhost:4003/api',
        method: 'GET'
    }

    try {
        // register request
        const { fire } = CircuitBreaker(request)
        const data = await fire()
        console.log("success! results: ",  data)
        res.json(data)
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