const path = require('path')
// const fetch = require('node-fetch')
const { request, gql } = require('graphql-request')

const express = require('express')

const { fire } = require('./circuit-breaker')

const server = express()

const port = 4000

const Redis = require("ioredis");
const redis = new Redis(); // default 6379

const CACHE_KEY_BOOKS = "books"


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

server.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'))
})


server.get('/results', async (req, res) => {
    res.json(await fetchData())
})

server.get('/page', async (req, res) => {
    try {
        const data = await fire()
        console.log("success! results: ",  data)
        res.json(data)
    } catch (e) {
        console.error("client: ", e)
        res.send("error: " + e)
    }
})

server.listen(port, () => {
    console.log("web server listening at 4000")
})