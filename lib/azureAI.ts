// lib/azureAI.ts

export async function detectBadWords(text: string): Promise<boolean> {
  const res = await fetch("/api/moderate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  const data = await res.json();
  return data.bad === true;
}