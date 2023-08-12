const CircuitBreakerLib = require('opossum')
const axios = require('axios');

const breakers = {}

const options = {
    timeout: 3000, // if function takes longer than 3 seconds, trigger failure
    errorThresholdPercentage: 50, // when 50% of requests fail, trip circuit
    resetTimeout: 30000 // try again after 30 sec
}

// one breaker per request
const CircuitBreaker = (request) => {
    // make sure a request is only registered once
    if (breakers[request.url]) {
        return breakers[request.url] 
    }

    // register new request
    const protectedFunction = async () => {
        const raw = await axios(request)
        // console.log(raw)
        return raw.data
    } 

    const breaker = new CircuitBreakerLib(protectedFunction, options);

    const fire = () => {
        return new Promise((resolve, reject) => {
            breaker.fire()
            .then((data) => {
                // res.json(data)
                resolve(data)
            })
            .catch((e) => {
                const errorMessage = "[circuit breaker] error: " + e.message
                console.error(errorMessage)
                // res.send(errorMessage)
                reject(errorMessage)
            });
        })
    }

    breakers[request.url] = {
        breaker,
        fire
    }

    return breakers[request.url]
}


module.exports = {
    CircuitBreaker
}
