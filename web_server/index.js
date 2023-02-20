const path = require('path')
const fetch = require('node-fetch')

const axios = require('axios')

const { request, gql } = require('graphql-request')

const express = require('express')
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

const delay = (delayMs = 1000) => {
    return new Promise((resolve) => {
        setTimeout(resolve, delayMs)
    })
}

const retryRequest = async (url, maxRetries = 5, backOffSeconds = 2000) => {
    let retries = 0

    while (retries < maxRetries) {
        retries++
        try {
            console.log("try " + retries + " out of " + maxRetries)
            const raw = await axios.get(url)
            // return res.json(raw.data)
            console.log("success!")
            return raw.data
            // break
        } catch (e) {
            // res.status(e.response.status).send(e.message)
            // instead of failing right away, just log for now
            console.error("server error - " + e.response.status + " : " + e.message)
        }

        await delay(backOffSeconds)
    }

    const failureMessage = "Max retries reached. Service unresponsive"

    console.error(failureMessage)
    throw new Error(failureMessage)
    
    // return res.status(500).send("Max retries reached. Service unresponsive")
}

server.get('/stuff', async (req, res) => {
    const maxRetries = 10
    const backOffSeconds = 5000
    
    try {
        const resp = await retryRequest('http://localhost:4001/api2', maxRetries, backOffSeconds)
        res.json(resp)
    } catch (e) {
        // res.status(e.response.status).send(e.message)
        res.status(500).send(e.message)
    }
})

// try {
//     const raw = await axios.get('http://localhost:4001/api2')
//     res.json(raw.data)
// } catch (e) {
//     res.status(e.response.status).send(e.message)
// }
// const response = raw.json()

// send request to /api2

server.listen(port, () => {
    console.log("web server listening at 4000")
})