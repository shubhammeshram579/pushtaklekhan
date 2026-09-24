/** @type {import('next').NextConfig} */
const nextConfig = {
   output: 'standalone',
  images: {
    domains: ['res.cloudinary.com', 'cloudinary.com'],
  },
};

module.exports = nextConfig;
