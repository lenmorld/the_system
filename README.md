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


## Kafka demo

catalog API (books_catalog)
- / renders book management UI for CRUD
- /api/books is called by web-server and returns books data
- Kafka producer: see produceEvent
  - produces an event to `books` topic for book CRUD events, e.g. book deleted, added

web-server
- /books calls book catalog API and renders a UI of list of books
- Kafka consumer: see consumeEvents
  - consumes `books` topic (one time setup)

### To demo

Confluent setup
- config is in `getting-started.properties` for both producer and consumer
- 

run web server
- see "KAFKA demo" and kafka/ folder
- call /books -> it should cache the response from Catalog

run books catalog API
- load /
- Do a CRUD operation, i.e. Delete a book
-> this should Produce a Delete event, 
causing the web server cache to invalidate
