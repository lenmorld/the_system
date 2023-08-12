const axios = require('axios')

const delay = (delayMs = 1000) => {
    return new Promise((resolve) => {
        setTimeout(resolve, delayMs)
    })
}

const retryRequest = async (request, maxRetries = 5, initialBackOffSeconds = 2000) => {
    let retries = 0
    let backOffSeconds = initialBackOffSeconds

    while (retries < maxRetries) {
        retries++
        try {
            console.log("try " + retries + " out of " + maxRetries)
            const raw = await axios(request)
            console.log("request succeeded! returning response")
            return raw.data
        } catch (e) {
            // res.status(e.response.status).send(e.message)
            // instead of failing right away, just log for now
            console.error("server error - " + e.response.status + " : " + e.message)
        }

        console.log(`waiting for ${backOffSeconds}ms, then retrying`)
        await delay(backOffSeconds)
        
        // e.g. retry 1: 2s, retry 2: 4s, retry 3: 8s, ... 
        backOffSeconds = backOffSeconds * 2
    }

    const failureMessage = `Failed after ${maxRetries} retries. This could be a non-transient failure `

    console.error(failureMessage)
    throw new Error(failureMessage)
}

module.exports = {
    retryRequest
}