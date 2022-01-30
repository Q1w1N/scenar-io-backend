import { Script } from "@prisma/client";
import { PubSub } from "graphql-subscriptions";
import { TypedPubSub } from "typed-graphql-subscriptions";

export type PubSubChannels = {
  newScript: [{ createdScript: Script }];
};

export const pubSub = new TypedPubSub<PubSubChannels>(new PubSub());
