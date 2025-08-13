/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "res.cloudinary.com",               // ✅ Cloudinary
      "firebasestorage.googleapis.com",   // ✅ Firebase Storage
      "i.pravatar.cc"                     // (Optional fallback avatar provider)
    ],
  },
};

module.exports = nextConfig;