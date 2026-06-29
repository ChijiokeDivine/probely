import { createInstance, SepoliaConfig, type FhevmInstance } from "@zama-fhe/relayer-sdk/node";

/**
 * IMPORTANT (Next.js): node-tfhe / node-tkms ship native WASM bindings that
 * webpack should not try to bundle. Add this package to your Next config:
 *
 *   // next.config.js (Next 15+)
 *   const nextConfig = { serverExternalPackages: ["@zama-fhe/relayer-sdk"] };
 *
 *   // Next 14
 *   const nextConfig = { experimental: { serverComponentsExternalPackages: ["@zama-fhe/relayer-sdk"] } };
 *
 * This module must only ever be imported from server-side code (Route
 * Handlers, Server Actions, services) — never from a Client Component.
 */

function getRpcUrl(): string {
  const url = process.env.SEPOLIA_RPC_URL;
  if (!url) throw new Error("Missing required env var: SEPOLIA_RPC_URL");
  return url;
}

let instancePromise: Promise<FhevmInstance> | null = null;

/**
 * Lazily creates (and caches) the FHEVM relayer instance. The instance holds
 * the TFHE public key + CRS fetched from the relayer, so creating it has a
 * real cost (network round trip) — reuse this across requests, don't
 * recreate it per-call.
 */
export function getFhevmInstance(): Promise<FhevmInstance> {
  if (!instancePromise) {
    instancePromise = createInstance({
      ...SepoliaConfig,
      network: getRpcUrl(),
    }).catch((err: unknown) => {
      // Allow a fresh attempt on the next call instead of permanently
      // caching a rejected promise.
      instancePromise = null;
      throw err;
    });
  }
  return instancePromise!;
}