import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  
  // Explicitly tell Next.js to track and include the WASM binary for this route
  outputFileTracingIncludes: {
    '/api/reviews/[id]/request-reveal': [
      './node_modules/.pnpm/node-tfhe@1.4.0-alpha.3/node_modules/node-tfhe/tfhe_bg.wasm',
    ],
  },
};

export default nextConfig;