import dns from "dns";
import mongoose from "mongoose";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  /* ignore if unsupported in environment */
}

const globalForMongo = globalThis as unknown as {
  mongoosePromise?: Promise<typeof mongoose>;
};

export function mongoUri() {
  return (
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    ""
  ).trim();
}

export async function connectMongo() {
  const uri = mongoUri();
  if (!uri) {
    throw new Error("MONGODB_URI (or MONGO_URI) is not set");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!globalForMongo.mongoosePromise) {
    globalForMongo.mongoosePromise = mongoose
      .connect(uri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10_000,
        connectTimeoutMS: 10_000,
      })
      .catch((err) => {
        // Allow retry on next call after a failed attempt
        globalForMongo.mongoosePromise = undefined;
        throw err;
      });
  }

  await globalForMongo.mongoosePromise;
  return mongoose;
}

export function isMongoConfigured() {
  return Boolean(mongoUri());
}
