const axios = require('axios')

/**
 * 
 * CLOSED - normal; monitor failures; switch to OPEN if failure threshold reached
 * 
 * reset failure_counter
 * 
 * do 
 *   if operation succeeds
 *     return result
 *   else
 *     if failure_counter >= failure_threshold
 *       switch to OPEN  # trip the circuit
 *       return
 *     end
 * 
 *     inc failure_counter
 *     return failure
 *   end
 * end
 * 
 * OPEN - allow recovery; switch to HALF-OPEN if recovery_timeout reached
 * 
 * start timer
 * 
 * do
 *   if recovery_timeout >= timer
 *     switch to HALF_OPEN
 *   else
 *     return failure
 *   end
 * end
 * 
 * HALF-OPEN - retry slowly; if success_threshold reached, switch to CLOSED; if fail once, switch to OPEN
 * 
 * reset success_counter
 * 
 * do
 *   if operation succeeds
 *      if success_threshold >= success_counter
 *        switch to CLOSED
 *        return
 *      end
 * 
 *      inc success_counter
 *      return result
 *   else
 *     switch to OPEN
 *   end
 * end
 * 
 */

const timestampToUtcString = (timestamp) => {
    const date = new Date()
    date.setTime(timestamp)
    return date.toUTCString()
}

// wrap request in circuit breaker
const CircuitBreaker2 = (operation) => {
    const CLOSED = "CLOSED"
    const OPEN = "OPEN"
    const HALF_OPEN = "HALF_OPEN"

    let failureCounter = 0
    let state = CLOSED
    let timestampLastFailure = 0
    let successCounter = 0
    let timestampOpened = 0

    // params
    const failureThreshold = 3
    const successThreshold = 3
    const recoveryDelayTime = 10000 // 10s

    const logTimes = () => {
        console.log(state, {
            failureCounter,
            successCounter,
            currentTimeStamp: timestampToUtcString(Date.now()),
            timestampOpened: timestampToUtcString(timestampOpened),
            timestampLastFailure: timestampToUtcString(timestampLastFailure),
        })
    }

    const execute = async () => {
        // console.log("==============")
        // console.log(`STATE: ${state}`)
        // console.log("failureCounter: ", failureCounter)
        // console.log("successCounter: ", successCounter)
        // console.log("timestampLastFailure: ", timestampToUtcString(timestampLastFailure))
        // console.log("timestampOpened: ", timestampToUtcString(timestampOpened))

        try {
            if (state === CLOSED) {
                try {
                    const result = await operation()
                    console.log(`result in CLOSED: `, result)
                    return result
                } catch (e) {
                    console.log(`catch CLOSED`)

                    timestampLastFailure = Date.now()

                    // TODO: reset failureCounter after a short period of time
                    // We don't want occasional failures spread over a day to accumulate and trip the CB
                    // We just want to count failures within a shorter period of time

                    if (failureCounter >= failureThreshold) {
                        timestampOpened = timestampLastFailure
                        state = OPEN
                        logTimes()
                        throw Error("Circuit breaker open")
                    }

                    failureCounter++

                    // TODO: how to throw/catch inside async-await
                    // throw failure, client must request again
                    throw Error(e)
                }
            } else if (state === OPEN) {
                failureCounter = 0

                // timer started when switched to OPEN
                const currentTimeStamp = Date.now()

                if ((currentTimeStamp - timestampOpened) > recoveryDelayTime) {
                    state = HALF_OPEN
                    logTimes()
                    // reset success counter only when switching
                    successCounter = 0

                    console.log("=====================")
                    console.log("OPEN -> HALF-OPEN")
                    console.log("=====================")

                    // === RE-TRY request ===
                    // to go to HALF_OPEN state, we need
                    // another request trigger
                    // TRY 1: recursive call
                    // return execute()

                    // TRY 2: include entire HALF-OPEN logic
                    // -----------------
                    successCounter = 0
                    try {
                        const result = await operation()

                        console.log("[inside OPEN] success in Half-open")
    
                        if (successCounter >= successThreshold) {
                            state = CLOSED
                            logTimes()
                            return result
                        }
    
                        successCounter++
                        return result
                    } catch (e) {
                        console.log("[inside OPEN] Request fail while in Half-open")
                        timestampLastFailure = Date.now()
                        timestampOpened = timestampLastFailure
                        
                        failureCounter = 0
                        successCounter = 0
    
                        state = OPEN
                        logTimes()
    
                        console.log("=====================")
                        console.log("HALF-OPEN -> OPEN")
                        console.log("=====================")
    
                        throw Error("Circuit breaker re-open")
                    }
                    // -----------------
                } else {
                    console.log("Error while OPEN")
                    logTimes()
                    throw Error("Circuit breaker still open")
                }
            } else if (state === HALF_OPEN) {
                try {
                    const result = await operation()

                    console.log("[inside HALF_OPEN] success in Half-open")

                    if (successCounter >= successThreshold) {
                        state = CLOSED
                        logTimes()
                        return result
                    }

                    successCounter++
                    return result
                } catch (e) {
                    console.log("[inside Half-open] Request fail while in Half-open")

                    timestampLastFailure = Date.now()
                    timestampOpened = timestampLastFailure
                    failureCounter = 0
                    successCounter = 0

                    state = OPEN
                    logTimes()

                    console.log("=====================")
                    console.log("HALF-OPEN -> OPEN")
                    console.log("=====================")

                    throw Error("Circuit breaker re-open")
                }
            }

        } catch (e) {
            console.error("high level catch: ", e)
            logTimes()
            return "high level catch error: " + e.toString()
        }
    }

    return {
        execute,
    }
}

const delay = (ms) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

// operation that has a delay and sometimes fail
const operation = async () => {
    // test failure
    // throw new Error("fail!")
    // await delay(3000)
    // return 1 + 1

    const res = await axios({
        url: 'http://localhost:4003/api2',
        method: 'GET'
    })

    return res.data
}

const circuitBreaker = CircuitBreaker2(operation)

const test = async () => {
    // const result = await operation()

    const result = await circuitBreaker.execute()

    // const result = await circuitBreaker.execute()
    // console.log("operation: ", result)
    return result
}

// main()

module.exports = {
    CircuitBreaker2,
    test
}