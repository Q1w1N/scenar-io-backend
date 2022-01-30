import { makeExecutableSchema } from "@graphql-tools/schema";
import { GraphQLContext } from "./contexts";
import typeDefs from "./schema.graphql";
import { APP_SECRET } from "./auth";
import { compare, hash } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { Script, User } from "@prisma/client";
import { PubSubChannels } from "./pubsub";

const resolvers = {
  Query: {
    info: () => `This is the API of a Hackernews Clone`,
    scripts: async (parent: unknown, args: {}, context: GraphQLContext) => {
      return context.prisma.script.findMany();
    },
    users: async (parent: unknown, args: {}, context: GraphQLContext) => {
      return context.prisma.user.findMany();
    },
    me: (parent: unknown, args: {}, context: GraphQLContext) => {
      if (context.currentUser === null) {
        throw new Error("Unauthenticated!");
      }

      return context.currentUser;
    },
  },
  Mutation: {
    createScript: async (
      parent: unknown,
      args: { name: string; description: string },
      context: GraphQLContext
    ) => {
      if (context.currentUser === null) {
        throw new Error("Unauthenticated!");
      }

      const newScript = await context.prisma.script.create({
        data: {
          name: args.name,
          description: args.description,
          createdBy: { connect: { id: context.currentUser.id } },
        },
      });

      console.log(context.currentUser.id);
      console.log(newScript);
      context.pubSub.publish("newScript", { createdScript: newScript });

      return newScript;
    },
    signup: async (
      parent: unknown,
      args: { email: string; password: string; name: string },
      context: GraphQLContext
    ) => {
      const password = await hash(args.password, 10);

      const user = await context.prisma.user.create({
        data: { ...args, password },
      });

      const token = sign({ userId: user.id }, APP_SECRET);

      return {
        token,
        user,
      };
    },
    login: async (
      parent: unknown,
      args: { email: string; password: string },
      context: GraphQLContext
    ) => {
      const user = await context.prisma.user.findUnique({
        where: { email: args.email },
      });
      if (!user) {
        throw new Error("No such user found");
      }

      const valid = await compare(args.password, user.password);
      if (!valid) {
        throw new Error("Invalid password");
      }

      const token = sign({ userId: user.id }, APP_SECRET);

      return {
        token,
        user,
      };
    },
  },
  Subscription: {
    newScript: {
      subscribe: (parent: unknown, args: {}, context: GraphQLContext) => {
        return context.pubSub.asyncIterator("newScript");
      },
      resolve: (payload: PubSubChannels["newScript"][0]) => {
        return payload.createdScript;
      },
    },
  },
  Script: {
    createdBy: async (parent: Script, args: {}, context: GraphQLContext) => {
      if (!parent.createdById) {
        return null;
      }

      return context.prisma.script
        .findUnique({ where: { id: parent.id } })
        .createdBy();
    },
  },
  User: {
    scripts: (parent: User, args: {}, context: GraphQLContext) =>
      context.prisma.user.findUnique({ where: { id: parent.id } }).scripts(),
  },
};

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
