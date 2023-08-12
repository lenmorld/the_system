const express = require('express')
const server = express()

const port = 4003

// CIRCUIT BREAKER demo
// delayed response
server.get('/api', async (req, res) => {
    const SERVICE_RESPONSE_TIME = 2000

    setTimeout(() => {
        res.json({ name: "lenny" })
    }, SERVICE_RESPONSE_TIME)
})

// failing endpoint
server.get('/api2', async (req, res) => {
    // really long timeout
    // setTimeout(() => {
    //     res.json({ name: "lenny" })
    // }, 2000)

    res.status(500).end("fail")
})

server.listen(port, () => {
    console.log("stuff api listening at 4003")
})