const express = require('express')
const server = express()

const port = 4003

server.get('/api', async (req, res) => {
    setTimeout(() => {
        res.json({ name: "lenny" })
    }, 2000)
})

server.listen(port, () => {
    console.log("web server listening at 4003")
})