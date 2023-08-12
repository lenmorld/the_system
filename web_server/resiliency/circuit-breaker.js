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
 * OPEN - allow recovery; switch to HALF-OPEN if timeout reached
 * 
 * start timer
 * 
 * do
 *   if recovery_delay_time >= timer
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




// wrap request in circuit breaker
const CircuitBreaker = (operation) => {
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
    const recoveryDelayTime = 5000 // 10s

    const execute = async () => {
        console.log("==============")
        console.log(`STATE: ${state}`)
        console.log("failureCounter: ", failureCounter)
        console.log("successCounter: ", successCounter)
        console.log("timestampLastFailure: ", timestampLastFailure)

        if (state === CLOSED) {
            try {
                const result = await operation()
                console.log(`result in CLOSED: `, result)
                return result
            } catch (e) {
                console.log(`catch CLOSED`)

                timestampLastFailure = Date.now()

                if (failureCounter >= failureThreshold) {
                    state = OPEN
                    timestampOpened = timestampLastFailure
                    throw Error("Circuit breaker open")
                }

                failureCounter++

                // TODO: how to throw/catch inside async-await
                throw Error(e)
            }
        } else if (state === OPEN) {
            failureCounter = 0

            // timer started when switched to OPEN
            const currentTimeStamp = Date.now()

            if ((currentTimeStamp - timestampOpened) > recoveryDelayTime) {
                state = HALF_OPEN
                // recursive call
                // execute()
                // FIXME: currently, to go to HALF_OPEN state, we need
                // another request trigger
            } else {
                throw Error("Circuit breaker still open")
            }
        } else if (state === HALF_OPEN) {
            successCounter = 0

            try {
                const result = await operation()

                if (successCounter >= successThreshold) {
                    state = CLOSED
                    return result
                }

                successCounter++
                return result
            } catch (e) {
                state = OPEN
                throw Error("Circuit breaker re-open")
            }
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
    await delay(1000)

    return 1 + 1
}

const main = () => {
    // const result = await operation()
    const circuitBreaker = CircuitBreaker(async () => {
        const result = await operation()
        console.log("operation: ", result)
    })

    circuitBreaker.execute()

    // const result = await operation()
    // console.log("operation: ", result)
}

// main()

module.exports = {
    CircuitBreaker
}