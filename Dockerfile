# Use Debian (not Alpine) to avoid native-binary headaches (sharp/tailwind-oxide etc.)
FROM node:20-bullseye

WORKDIR /app

# 1) Install deps first for better caching
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# 2) Copy the rest of the source
COPY . .

# 3) Provide public envs during build so Next can compile client bundles
#    (This file contains ONLY NEXT_PUBLIC_* keys; it is safe to bake.)
COPY env.public .env.production

# Build Next.js app
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Cloud Run runtime
ENV PORT=8080
EXPOSE 8080
CMD [ "npm", "run", "start" ]
