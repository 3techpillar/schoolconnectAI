import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { resolve, join } from "path";
import { readdirSync, statSync } from "fs";
import { connectMongo } from "@/lib/db/mongodb.js";
import { otpRateLimiter, apiRateLimiter } from "@/middleware/rate-limit.js";
import { wrapNextRoute } from "@/lib/server/express-wrapper.js";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const app = express();

app.use(helmet());
app.use(express.json());

// Apply rate limits
app.use("/api/auth/otp/send", otpRateLimiter);
app.use("/api/auth/otp/verify", otpRateLimiter);
app.use("/api", apiRateLimiter);

// Configure CORS
const origins = process.env.CORS_ORIGINS?.split(",").map((s) => s.trim()) || ["http://localhost:3000"];
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || origins.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Dynamically discover and mount routes
function getRouteFiles(dir: string): string[] {
  let files: string[] = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files = files.concat(getRouteFiles(fullPath));
    } else if (entry === "route.ts" || entry === "route.js") {
      files.push(fullPath);
    }
  }
  return files;
}

const routesDir = join(__dirname, "routes");
const routeFiles = getRouteFiles(routesDir);

async function loadRoutes() {
  for (const file of routeFiles) {
    let relPath = file.substring(routesDir.length).replace(/\\/g, "/");
    relPath = relPath.replace(/\/route\.[jt]s$/, "");
    if (!relPath.startsWith("/")) relPath = "/" + relPath;

    // Convert Next.js [id] syntax to Express :id syntax
    const expressPath = "/api" + relPath.replace(/\[([^\]]+)\]/g, ":$1");
    
    try {
      // Must use pathToFileURL for dynamic imports of absolute Windows paths
      const module = await import(pathToFileURL(file).href);
      
      const methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
      for (const method of methods) {
        if (typeof module[method] === "function") {
          const handler = module[method];
          const expressHandler = handler.isWrapped ? handler : wrapNextRoute(handler);
          
          if (method === "GET") app.get(expressPath, expressHandler);
          else if (method === "POST") app.post(expressPath, expressHandler);
          else if (method === "PUT") app.put(expressPath, expressHandler);
          else if (method === "PATCH") app.patch(expressPath, expressHandler);
          else if (method === "DELETE") app.delete(expressPath, expressHandler);
          else if (method === "OPTIONS") app.options(expressPath, expressHandler);
          
          console.log(`Mounted ${method} ${expressPath}`);
        }
      }
    } catch (err) {
      console.error(`Failed to load route file ${file}:`, err);
    }
  }
}

async function startServer() {
  try {
    await connectMongo();
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Failed to connect to MongoDB. Server will still start.", err);
  }

  await loadRoutes();

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
  const host = process.env.HOST || "127.0.0.1";
  
  app.listen(port, host, () => {
    console.log(`Server listening on http://${host}:${port}`);
  });
}

startServer();
