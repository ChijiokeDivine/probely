import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],

  // Don't bundle the Zama SDK or node-tfhe.
  serverExternalPackages: [
    "@zama-fhe/relayer-sdk",
    "node-tfhe",
  ],

  outputFileTracingIncludes: {
    "/api/reviews/[id]/request-reveal": [
      "./node_modules/.pnpm/node-tfhe@1.4.0-alpha.3/node_modules/node-tfhe/tfhe_bg.wasm",
    ],
    "/api/reviews/[id]/submit-score": [
      "./node_modules/.pnpm/node-tfhe@1.4.0-alpha.3/node_modules/node-tfhe/tfhe_bg.wasm",
    ],
  },
};

export default nextConfig;