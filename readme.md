# Kafka
[get started](https://kafka.apache.org/42/getting-started/introduction/)
Kafka is distributed, event-store, real time streaming platform

Producer to broker
broker store and manage

then goes to consumer group based on needs

consider it as a chain reaction mechanism
real time analytics

## Message

piece of data handled
3 parts: Headers(Topics & Partitions), Key, Value

## Topics & Partitions

messages are organised into topics

within each topic kafka goes a step further by diving into partitions
they allow mesages to be processed parallely across multiple consumer to acheive high throughput

handles multiple prducers, consumers very efficiently independently
allows to store messages even after they are being consumed with time or size limit

scalable

## Producers

application that create and send messages to kafka
patch messages together to cut down network traffic
use partitioners to deduce which partitions a message should go to

messages are randomly divided across partitions

## Consumers

receiving end
consumers in consumer group share responsibility for processing messages from different partitions in parallel
each partition is assigned to only 1 consumer within a group
if a consumer fails, another automatically takes over for uninterrepted processing

kafka auto handles them
when a consumer joins/leaves a group, kafka triggers a rebalance to redistribute partitions among remaining consumers.

## Cluster

kafka cluster is made up of multiple brokers
servers that store and manage our data
to keep data safe each partition is replicated across several brokers using a leader-follower mark
if 1 fails, another steps in as new leader without losing any data

# APIs

4 apis: Producer, Consumer, Streams, Connector

[interview prep](https://x.com/i/status/2006733716614426850)
