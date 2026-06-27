import { Kafka, KafkaConfig, ProducerConfig, ConsumerConfig, AdminConfig } from "kafkajs";

// --- Broker Configuration ---
// Common production setup: multiple brokers for HA
// Local dev: single broker on localhost:9092
const brokers = process.env.KAFKA_BROKERS?.split(",") || ["localhost:9092"];

// --- Kafka Client Configuration ---
const kafkaConfig: KafkaConfig = {
  clientId: process.env.KAFKA_CLIENT_ID || "my-kafka-app",
  brokers,
  // Retry connection to broker (default: 10 retries, 300ms between retries)
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
  // Authentication (if using SASL)
  // sasl: {
  //   mechanism: "scram-sha-256",
  //   username: process.env.KAFKA_SASL_USERNAME!,
  //   password: process.env.KAFKA_SASL_PASSWORD!,
  // },
  // TLS (production)
  // ssl: true,
};

export const kafka = new Kafka(kafkaConfig);

// --- Producer Configuration ---
// acks controls durability:
//   0  = fire-and-forget (fastest, messages can be lost)
//   1  = leader acknowledges (moderate durability)
//   all = all ISR replicas acknowledge (strongest durability)
export const producerConfig: ProducerConfig = {
  allowAutoTopicCreation: false, // topics should be created via admin
  transactionalId: "my-transactional-id", // required for transactions
  idempotent: true, // prevents duplicate writes from retries
  acks: -1, // acks=all — wait for all ISR replicas
  retries: 5,
  // batching
  linger: 5, // ms to wait for more messages before sending a batch
  maxInFlightRequests: 5, // max requests in flight (set to 1 for strict ordering with retries)
  compression: 1, // 0=none, 1=gzip, 2=snappy, 3=lz4, 4=zstd
};

// --- Consumer Configuration ---
// Each consumer must belong to a group; each partition is assigned to exactly 1 consumer in the group
export const consumerConfig: ConsumerConfig = {
  groupId: process.env.KAFKA_GROUP_ID || "my-consumer-group",
  sessionTimeout: 30000, // ms — how long broker waits before considering consumer dead
  rebalanceTimeout: 60000, // ms — time consumer has to finish current work before rebalance
  fromBeginning: false, // true = read from earliest offset, false = read from latest
  // Heartbeat interval (must be < sessionTimeout / 3)
  heartbeat: 3000,
  maxBytesPerPartition: 1048576, // 1MB per partition per fetch
  minBytes: 1, // minimum bytes to fetch
  maxBytes: 10485760, // 10MB max per fetch request
};

// --- Admin Configuration ---
export const adminConfig: AdminConfig = {
  // no special config needed, uses the Kafka client settings
};

// --- Topic Defaults ---
export const defaultTopicConfig = {
  topic: "my-topic",
  numPartitions: 3,
  replicationFactor: 3, // production: 3 brokers minimum
  // Retention settings
  configEntries: [
    { name: "retention.ms", value: "604800000" }, // 7 days
    { name: "retention.bytes", value: "-1" }, // unlimited
    { name: "cleanup.policy", value: "delete" }, // or "compact" for log compaction
  ],
};
