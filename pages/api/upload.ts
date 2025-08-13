// pages/api/upload.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "2mb", // allow up to 2MB
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end("Method not allowed");

  const { file } = req.body;
  if (!file) return res.status(400).json({ error: "No file provided" });

  try {
    const uploaded = await cloudinary.uploader.upload(file, {
      folder: "employee-profiles",
    });

    return res.status(200).json({ url: uploaded.secure_url });
  } catch {
    return res.status(500).json({ error: "Cloudinary upload failed" });
  }
}
