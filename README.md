# SETUP

For each service, do `npm install` then `npm start`

web-server
- port 4000
- /page
- /stuff

api2
- port 4001
- /api2

stuff-api
- port 4003
- /api

books_catalog
- 4004
- / for books management CRUD
- /api/books

## Retry pattern

Run web-server
- see "RETRY demo"
- configure maxRetries and initialBackOffSeconds
- send request to api2

Run api2
- see "RETRY demo"
- configure TRANSIENT_FAILURE

## Circuit breaker 1

Run web-server
- see "CIRCUIT BREAKER demo"
- configure CB options in circuit-breaker-opposum
- verify "circuit-breaker-opposum" as CircuitBreaker in index.js
- run /page request to test

Run stuff-api
- see "CIRCUIT BREAKER demo"
- configure SERVICE_RESPONSE_TIME

## Circuit breaker 2

same as 1, but home-baked CB instead of using library

web-server
- verify "circuit-breaker-home-baked" as CircuitBreaker in index.js
- run /page2 request to test


