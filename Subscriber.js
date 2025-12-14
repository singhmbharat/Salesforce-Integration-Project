/**
 * VERY SIMPLE BEGINNER-FRIENDLY PUB/SUB SUBSCRIBER
 * -------------------------------------------------
 * This file:
 * - Connects to Salesforce Pub/Sub API using gRPC
 * - Authenticates with an OAuth access token
 * - Subscribes to a Platform Event topic
 * - Prints every event received (even those published via POSTMAN)
 */

import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import dotenv from 'dotenv';
dotenv.config();

// ------------------------------------------------------------
// 1. Load Salesforce Pub/Sub Proto
// ------------------------------------------------------------
const PROTO_PATH = './proto/pubsub_api.proto';

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);

// This depends on the proto namespace name (usually "pubsub")
const PubSubAPI = protoDescriptor.pubsub.PubSub;

// ------------------------------------------------------------
// 2. Salesforce gRPC Client
// ------------------------------------------------------------
const sfEndpoint = process.env.SF_PUBSUB_ENDPOINT; // api.pubsub.salesforce.com:7443
const sfAccessToken = process.env.SF_ACCESS_TOKEN; // your Bearer token

// SSL credentials
const sslCreds = grpc.credentials.createSsl();

// Authentication metadata
const authCreds = grpc.credentials.createFromMetadataGenerator((params, callback) => {
  const metadata = new grpc.Metadata();
  metadata.add("authorization", `Bearer ${sfAccessToken}`);
  callback(null, metadata);
});

// Combine SSL + Bearer token
const credentials = grpc.credentials.combineChannelCredentials(sslCreds, authCreds);

// Create client
const client = new PubSubAPI(sfEndpoint, credentials);

// ------------------------------------------------------------
// 3. Subscribe to Salesforce Platform Event
// ------------------------------------------------------------
function startSubscription() {
  console.log(`📡 Connecting to Salesforce topic: ${process.env.SF_TOPIC}`);

  const call = client.Subscribe();

  // When events come in
  call.on("data", (response) => {
    if (!response.events || response.events.length === 0) return;

    response.events.forEach((evt) => {
      console.log("\n🔥 RECEIVED EVENT FROM SALESFORCE");
      console.log("Event Body:", evt.event);

      const replayId = evt.replayId?.toString("base64");
      console.log("Replay ID:", replayId);
    });
  });

  call.on("error", (err) => {
    console.error("❌ gRPC Error:", err);
  });

  call.on("end", () => {
    console.log("Stream ended by server");
  });

  // Actual subscription request
  call.write({
    topicName: process.env.SF_TOPIC,
    replayPreset: "LATEST"  // only new events
  });
}

startSubscription();
