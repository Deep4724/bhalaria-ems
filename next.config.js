// next.config.js

module.exports = {
  reactStrictMode: true,
    images: {
    domains: [
      "res.cloudinary.com",
      // you can add more if needed: "i.pravatar.cc", "lh3.googleusercontent.com", etc.
    ],
  },
  env: {
    AZURE_OPENAI_ENDPOINT: process.env.AZURE_OPENAI_ENDPOINT,
    AZURE_OPENAI_KEY: process.env.AZURE_OPENAI_KEY,
    AZURE_OPENAI_DEPLOYMENT: process.env.AZURE_OPENAI_DEPLOYMENT,
    AZURE_OPENAI_API_VERSION: process.env.AZURE_OPENAI_API_VERSION,
},
};