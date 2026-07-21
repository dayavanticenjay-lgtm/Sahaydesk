import OpenAI from "openai";

let client: OpenAI | null = null;

function getClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
    });
  }
  return client;
}

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export async function summarizeConversation(input: { subject: string; body: string; conversation: string }) {
  const openai = getClient();
  if (!openai) throw new Error("AI is not configured. Set OPENAI_API_KEY.");

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that summarizes support ticket conversations. " +
          "Provide a clear, concise summary that captures the customer's issue, any actions taken, and the current status. " +
          "Keep the summary to 2-4 sentences. Return only the summary with no preamble.",
      },
      {
        role: "user",
        content:
          `Subject: ${input.subject}\n\n` +
          `Customer message:\n${input.body}\n\n` +
          (input.conversation !== "" ? `Conversation:\n${input.conversation}` : "No replies yet."),
      },
    ],
  });

  return (response.choices[0]?.message?.content ?? "").trim();
}

export async function polishReply(input: { body: string; agentName: string; customerName: string }) {
  const openai = getClient();
  if (!openai) throw new Error("AI is not configured. Set OPENAI_API_KEY.");

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a helpful writing assistant for a customer support team. " +
          "Improve the given reply for clarity, professional tone, and grammar. " +
          "Preserve the original meaning and keep the response concise. " +
          "Return only the improved text with no preamble or explanation. " +
          `Address the customer by their name: ${input.customerName}. ` +
          `End the reply with a sign-off using the agent's name: ${input.agentName}.`,
      },
      { role: "user", content: input.body },
    ],
  });

  return (response.choices[0]?.message?.content ?? "").trim();
}
