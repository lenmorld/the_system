web-server

- serve a page with books
  - fetches from book catalog
  - caches
- consumes Kafka message -> book edited
  - must invalidate book cache

catalog
- book management
- allows books to be added, edited, etc
- when a book added, publishes Kafka message -> book edited

TODO

[/] web server - route and books ui 
[/] catalog API - route with some sample data
[/] catalog CRUD UI - add and delete
[/] Kafka setup
  - create 'books' topic in Confluent cloud
[/] catalog API - Kafka Producer
[/] web server - Kafka Consumer

[ ] web-server setup Cache for books UI
[ ] on message - invalidate cache

[ ] catalog API - fakes
[ ] catalog API - fetch from an API