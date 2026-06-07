/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@ston-fi/omniston-sdk-react",
    "@ston-fi/omniston-sdk",
    "@ston-fi/api",
    "@tonconnect/ui-react",
    "@ton/core",
    "@ton/ton"
  ],
  webpack: (config) => {
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs: false,
      net: false,
      tls: false
    };
    return config;
  }
};

export default nextConfig;
