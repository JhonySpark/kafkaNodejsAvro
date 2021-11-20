const { Kafka } = require('kafkajs');
const {
	SchemaRegistry,
	SchemaType,
} = require('@kafkajs/confluent-schema-registry');

const main = async () => {
	const registry = new SchemaRegistry({ host: 'http://localhost:8081/' });

	const schema = {
		type: 'record',
		name: 'animal',
        namespace: 'test',
		fields: [
			{
				name: 'kind',
				type: {
					type: 'enum',
					name: 'animalKind',
					symbols: ['CAT', 'DOG'],
				},
			},
			{ name: 'name', type: 'string' },
		],
	};

	const { id } = await registry.register({
		schema: JSON.stringify(schema),
		type: SchemaType.AVRO,
	});

	const kafka = new Kafka({
		clientId: 'my-app',
		brokers: ['localhost:9092'],
	});

	//producer

	const producer = kafka.producer();

	await producer.connect();

	const payload = { kind: 'CAT', name: 'Albert' };
	encodedValue = await registry.encode(id, payload);
	await producer.send({
		topic: 'test-topic',
		messages: [{ value: encodedValue }],
	});

	await producer.disconnect();

	//consumer

	const consumer = kafka.consumer({ groupId: 'test-group' });

	await consumer.connect();
	await consumer.subscribe({ topic: 'test-topic', fromBeginning: true });

	await consumer.run({
		eachMessage: async ({ topic, partition, message }) => {
			const decodedValue = await registry.decode(message.value);
			console.log(decodedValue);
		},
	});
};

main();
