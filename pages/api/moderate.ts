// pages/api/moderate.ts

import type { NextApiRequest, NextApiResponse } from "next";
import * as dotenv from "dotenv";
dotenv.config();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { text } = req.body;
  if (!text || typeof text !== "string" || text.trim() === "") {
    return res.status(400).json({ error: "No text provided" });
  }

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const key = process.env.AZURE_OPENAI_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION;

  if (!endpoint || !key || !deployment || !apiVersion) {
    return res.status(500).json({ error: "❌ Azure config missing" });
  }

  try {
    const aiRes = await fetch(
      `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": key,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "You are a strict content moderator. Only respond with Yes or No. No explanation.",
            },
            {
              role: "user",
              content: `Does this sentence contain any inappropriate, profane, or abusive language: "${text}"`,
            },
          ],
          temperature: 0,
          max_tokens: 1,
        }),
      }
    );

    const data = await aiRes.json();
    const content = data?.choices?.[0]?.message?.content?.trim().toLowerCase();
    const bad = content === "yes" || content?.startsWith("yes");

    return res.status(200).json({ bad });
  } catch (err) {
    console.error("🔥 MODERATION ERROR:", err);
    return res.status(500).json({ error: "AI moderation failed" });
  }
}
