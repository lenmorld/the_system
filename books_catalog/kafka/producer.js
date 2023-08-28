const Kafka = require('node-rdkafka');
const { configFromPath } = require('./util');

const CONFIG_PATH = __dirname + '/getting-started.properties'

console.log("CONFIG_PATH: ", CONFIG_PATH)

function createConfigMap(config) {
    return {
        'bootstrap.servers': config['bootstrap.servers'],
        'sasl.username': config['sasl.username'],
        'sasl.password': config['sasl.password'],
        'security.protocol': config['security.protocol'],
        'sasl.mechanisms': config['sasl.mechanisms'],
        'dr_msg_cb': true
    }
}

function createProducer(config, onDeliveryReport) {
    const producer = new Kafka.Producer(createConfigMap(config))

    return new Promise((resolve, reject) => {
        producer
            .on('ready', () => resolve(producer))
            .on('delivery-report', onDeliveryReport)
            .on('event.error', (err) => {
                console.warn('event.error', err)
                reject(err)
            })

        producer.connect()
    })
}

/*
events must be in this format

// const events = {
//     'user01': 'purchased book11', 
//     'user02': 'purchased book22', 
//     'user03': 'purchased book33', 
// }
*/
async function produceEvent(topic, events) {
    const config = await configFromPath(CONFIG_PATH)

    const producer = await createProducer(config, (err, report) => {
        if (err) {
            console.warn('Error producing', err)
        } else {
            const { topic, key, value } = report
            let k = key.toString().padEnd(10, ' ')
            console.log(`Produced event to topic ${topic}: key = ${k} value = ${value} `)
        }
    })

    // produce events
    Object.keys(events).forEach(key => {
        const value = Buffer.from(events[key])
        producer.produce(topic, -1, value, key);
    })

    // https://github.com/Blizzard/node-rdkafka#standard-api
    // producer.produce(
    //     // Topic to send the message to
    //     'topic',
    //     // optionally we can manually specify a partition for the message
    //     // this defaults to -1 - which will use librdkafka's default partitioner (consistent random for keyed messages, random for unkeyed messages)
    //     null,
    //     // Message to send. Must be a buffer
    //     Buffer.from('Awesome message'),
    //     // for keyed messages, we also specify the key - note that this field is optional
    //     'Stormwind',
    //     // you can send a timestamp here. If your broker version supports it,
    //     // it will get added. Otherwise, we default to 0
    //     Date.now(),
    //     // you can send an opaque token here, which gets passed along
    //     // to your delivery reports
    //   );

    // flush internal queue, sending all messages
    producer.flush(10000, () => {
        producer.disconnect()
    })
}

// ==== SAMPLE USAGE ====

// const TOPIC = "poems"
// const events = {
//     'user01': 'purchased book11', 
//     'user02': 'purchased book22', 
//     'user03': 'purchased book33', 
// }
// produceEvent(TOPIC, events)
//     .catch(err => {
//         console.error(`producer error: \n${err}`)
//         process.exit(1)
//     })

module.exports = {
    produceEvent
}