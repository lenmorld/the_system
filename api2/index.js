const path = require('path')

// const { request, gql } = require('graphql-request')

const express = require('express')
const server = express()

const port = 4001

// const Redis = require("ioredis");
// const redis = new Redis(); // default 6379

// const CACHE_KEY_BOOKS = "books"

let callTimes = 0

// RETRY demo
server.get('/api2', async (req, res) => {
    const TRANSIENT_FAILURE = 5

    callTimes++

    // simulate a service with a transient failure
    if (callTimes < TRANSIENT_FAILURE) {
        res.status(500).send('server error')
    } else {
        res.json({ name: "Lenny" })
    }
})

server.listen(port, () => {
    console.log("api2 listening at 4001")
})