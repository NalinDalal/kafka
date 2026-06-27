/**
 * KafkaJS Example — Producer, Consumer, and Admin
 *
 * Prerequisites:
 *   1. Kafka running locally (docker-compose up -d)
 *   2. npm install kafkajs
 *   3. npm install -D typescript @types/node ts-node
 *   4. npx ts-node index.ts
 */

import {
  kafka,
  producerConfig,
  consumerConfig,
  defaultTopicConfig,
} from "./config";

// ──────────────────────────────────────────────
// 1. Admin — create topic
// ──────────────────────────────────────────────
async function createTopic() {
  const admin = kafka.admin();
  await admin.connect();

  const topicExists = await admin.listTopics();
  if (!topicExists.includes(defaultTopicConfig.topic)) {
    await admin.createTopics({
      topics: [
        {
          topic: defaultTopicConfig.topic,
          numPartitions: defaultTopicConfig.numPartitions,
          replicationFactor: defaultTopicConfig.replicationFactor,
        },
      ],
    });
    console.log(`Topic "${defaultTopicConfig.topic}" created`);
  } else {
    console.log(`Topic "${defaultTopicConfig.topic}" already exists`);
  }

  await admin.disconnect();
}

// ──────────────────────────────────────────────
// 2. Producer — send messages
// ──────────────────────────────────────────────
async function produce() {
  const producer = kafka.producer(producerConfig);
  await producer.connect();

  const topic = defaultTopicConfig.topic;

  // Using keys ensures messages with the same key land on the same partition,
  // preserving ordering per key.
  await producer.send({
    topic,
    messages: [
      {
        key: "user:1",
        value: JSON.stringify({ event: "signup", userId: 1, ts: Date.now() }),
      },
      {
        key: "user:2",
        value: JSON.stringify({ event: "signup", userId: 2, ts: Date.now() }),
      },
      {
        key: "user:1",
        value: JSON.stringify({
          event: "purchase",
          userId: 1,
          item: "laptop",
          ts: Date.now(),
        }),
      },
    ],
    // Per-message acks override (optional, uses producerConfig acks by default)
    // acks: -1,
  });

  console.log("Messages sent");
  await producer.disconnect();
}

// ──────────────────────────────────────────────
// 3. Consumer — read messages
// ──────────────────────────────────────────────
async function consume() {
  const consumer = kafka.consumer(consumerConfig);
  await consumer.connect();

  // fromBeginning: true reads all existing messages; false reads only new ones
  await consumer.subscribe({
    topic: defaultTopicConfig.topic,
    fromBeginning: true,
  });

  await consumer.run({
    // eachBatch gives you control over commit timing
    // eachMessage is simpler for most use cases
    eachMessage: async ({ topic, partition, message }) => {
      const prefix = `${topic}[${partition}]@${message.offset}`;
      const key = message.key?.toString() ?? "null";
      const value = message.value?.toString() ?? "null";
      console.log(`- ${prefix} key=${key} value=${value}`);

      // ─── Delivery semantics via commit timing ───
      // At-most-once:  commit BEFORE processing (fast, may lose messages)
      // At-least-once: commit AFTER processing  (safe, possible duplicates)
      // Exactly-once:  use Kafka transactions + idempotent producer
    },
  });
}

// ──────────────────────────────────────────────
// 4. Transaction Example — atomic multi-topic write
// ──────────────────────────────────────────────
async function produceWithTransaction() {
  const producer = kafka.producer({
    ...producerConfig,
    transactionalId: "my-transactional-id", // unique per process
    idempotent: true,
  });

  await producer.connect();
  await producer.sendOffsetsToTransaction({
    // Not used here, but shows the API
    offsets: [],
    groupId: consumerConfig.groupId,
  });

  const transaction = await producer.beginTransaction();

  try {
    // Atomic write: either ALL succeed or NONE are visible
    await transaction.send({
      topic: "topic-orders",
      messages: [{ key: "order:1", value: JSON.stringify({ orderId: 1 }) }],
    });
    await transaction.send({
      topic: "topic-payments",
      messages: [{ key: "pay:1", value: JSON.stringify({ paymentId: 1 }) }],
    });
    await transaction.commit();
    console.log("Transaction committed");
  } catch (err) {
    await transaction.abort();
    console.error("Transaction aborted", err);
  } finally {
    await producer.disconnect();
  }
}

// ──────────────────────────────────────────────
// Run
// ──────────────────────────────────────────────
async function main() {
  await createTopic();
  await produce();
  await consume();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
