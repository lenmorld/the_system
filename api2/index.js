const path = require('path')

// const { request, gql } = require('graphql-request')

const express = require('express')
const server = express()

const port = 4001

// const Redis = require("ioredis");
// const redis = new Redis(); // default 6379

// const CACHE_KEY_BOOKS = "books"

let callTimes = 0

server.get('/api2', async (req, res) => {
    callTimes++

    // simulate a service that sometimes succeeds and sometimes fails
    if (callTimes < 5) {
        res.status(500).send('server error')
    } else {
        res.json({ name: "Lenny" })
    }
})

server.listen(port, () => {
    console.log("web server listening at 4001")
})