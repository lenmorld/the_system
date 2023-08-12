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

web-server  ---> stuff-api
web-server  ---> api2

### Retry demo

Run web-server
- see "RETRY demo"
- configure maxRetries and initialBackOffSeconds
- send request to api2

Run api2
- see "RETRY demo"
- configure TRANSIENT_FAILURE

### Circuit breaker demo 1

Run web-server
- see "CIRCUIT BREAKER demo"
- configure CB options

Run stuff-api
- see "CIRCUIT BREAKER demo"
- configure SERVICE_RESPONSE_TIME