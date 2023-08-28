const Kafka = require('node-rdkafka');
const { configFromPath } = require('./util');

const CONFIG_PATH = __dirname + '/getting-started.properties'

function createConfigMap(config) {
    return {
        'bootstrap.servers': config['bootstrap.servers'],
        'sasl.username': config['sasl.username'],
        'sasl.password': config['sasl.password'],
        'security.protocol': config['security.protocol'],
        'sasl.mechanisms': config['sasl.mechanisms'],
        'group.id': 'kafka-nodejs-getting-started'
    }
}

function createConsumer(config, onData) {
    const consumer = new Kafka.KafkaConsumer(
        createConfigMap(config),
        {
            // start reading from beginning of topic
            // if no committed offset exists
            'auto.offset.reset': 'earliest'
        }
    )

    return new Promise((resolve, reject) => {
        consumer
            .on('ready', () => resolve(consumer))
            .on('data', onData)

        consumer.connect()
    })
}

async function consumeEvents(topic, onEventCallback) {
    const config = await configFromPath(CONFIG_PATH)

    const consumer = await createConsumer(config, ({ key, value }) => {
        let k = key.toString().padEnd(10, ' ')
        console.log(`Consumed event from topic ${topic}: key = ${k} value = ${value}`)
    })

    consumer.subscribe([topic])

    // https://github.com/Blizzard/node-rdkafka#standard-api-1
    // Gets messages from the existing subscription as quickly as possible. 
    // If cb is specified, invokes cb(err, message).
    consumer.consume(onEventCallback)


    // on Ctrl+C
    process.on('SIGINT', () => {
        console.log('\nDisconnecting consumer ...')
        consumer.disconnect()
    })
}


// usage
// const TOPIC = "poems"

// consumerExample(TOPIC)
//     .catch(err => {
//         console.error(`consumer error: \n${err}`)
//         process.exit(1)
//     })

module.exports = {
    consumeEvents
}