import { getServerEnv } from "./lib/env";

export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    getServerEnv();
  }
}
