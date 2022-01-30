declare module "*/schema.graphql" {
  import { DocumentNode } from "graphql";
  const defaultDocument: DocumentNode;
  export const user: DocumentNode;

  export default defaultDocument;
}
