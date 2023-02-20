const CircuitBreaker = require('opossum')
const axios = require('axios');


const options = {
    timeout: 3000, // if function takes longer than 3 seconds, trigger failure
    errorThresholdPercentage: 50, // when 50% of requests fail, trip circuit
    resetTimeout: 30000 // try again after 30 sec
}

// TODO: make this more reusable with a Class or a
// object of all services

const sendRequestToStuffApi = async () => {
    const raw = await axios.get('http://localhost:4003/api')
    // console.log(raw)
    return raw.data
}

const breaker = new CircuitBreaker(sendRequestToStuffApi, options);

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

module.exports = {
    fire
}