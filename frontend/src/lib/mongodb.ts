import { MongoClient } from "mongodb";

const rawUri = (process.env.MONGODB_URI || "").trim();

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function ensureValidUri(uri: string) {
  if (!uri || !(uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://"))) {
    throw new Error("Invalid MongoDB URI. It must start with mongodb:// or mongodb+srv://");
  }
}

async function getClient(): Promise<MongoClient> {
  ensureValidUri(rawUri);
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(rawUri);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise as Promise<MongoClient>;
  }
  const client = new MongoClient(rawUri);
  return client.connect();
}

export async function getDb() {
  const cli = await getClient();
  const dbName = (process.env.MONGODB_DB || "steel_scrap_db").trim();
  return cli.db(dbName);
}


