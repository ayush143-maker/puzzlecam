/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // avoid double getUserMedia in dev
  eslint: { ignoreDuringBuilds: true },
};
export default nextConfig;
