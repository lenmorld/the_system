# Confluent Kafka

For details, see Notion page
https://lennythedev.notion.site/Confluent-cloud-Node-js-01aa0049bb974773b3883f3e8a4aa72c?pvs=4

# When installing node-rdkafka, make sure to follow these instructions before `npm install`
https://github.com/Blizzard/node-rdkafka/blob/master/README.md#mac-os-high-sierra--mojave

# CLI login

```
confluent login
```

Credentials:
lenmorld@live.com
ehj%LbzP#1L2H$J&

cluster_0

environment:
env-7nvpzw

cluster:
lkc-v1z0dj

+------------+------------------------------------------------------------------+
| API Key    | X7K2UHXBU7OWC6BV                                                 |
| API Secret | S56Z2oUETfUYWI4EID/rU93Gw92j9KHaWg9EuohmDTGyjsA4TlnqrOpU5aQPmRnZ |
+------------+------------------------------------------------------------------+

### Login
confluent login --save

### Do commands

List topics
```
confluent kafka topic list
```

Produce to topic
```
confluent kafka topic produce topic_name --parse-key
```

Consume from topic
```
confluent kafka topic consume --from-beginning topic_name
```

# Bootstrap endpoint
pkc-419q3.us-east4.gcp.confluent.cloud:9092
