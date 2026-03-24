const { loadEnv } = require("./env");
const { getSiteData, getDashboardData } = require("./supabase");

loadEnv();

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models";

const languageLabels = {
  en: "English",
  hi: "Hindi",
  te: "Telugu"
};

function hasGeminiConfig() {
  return Boolean(process.env.GEMINI_API_KEY);
}

function createGeminiError(message, statusCode = 502) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function formatList(items, mapper, limit = 4) {
  if (!Array.isArray(items) || items.length === 0) {
    return "Not available.";
  }

  return items
    .slice(0, limit)
    .map((item) => mapper(item))
    .filter(Boolean)
    .join("\n");
}

function buildDashboardContext(siteData, dashboardData) {
  const selectedLanguage =
    languageLabels[siteData.selectedLanguage] || languageLabels.en;

  const soilSummary = formatList(
    dashboardData.overview?.soilData,
    (item) => `- ${item.label}: ${item.value}${item.unit ? ` ${item.unit}` : ""}`,
    8
  );

  const organicRecommendations = formatList(
    dashboardData.recommendations?.organic,
    (item) => `- ${item.title}: ${item.detail}`,
    3
  );

  const inorganicRecommendations = formatList(
    dashboardData.recommendations?.inorganic,
    (item) => `- ${item.title}: ${item.detail}`,
    3
  );

  const realtimeMetrics = formatList(
    dashboardData.realtime?.metrics,
    (item) => `- ${item.label}: ${item.value} (${item.change})`,
    6
  );

  return [
    "You are AgriCure Assistant, a practical farm support chatbot for the Mandapam dashboard.",
    `Preferred response language: ${selectedLanguage}.`,
    "Use the dashboard context below when it is relevant.",
    "If the user asks for live or site-specific advice that is not supported by the context, say that clearly instead of guessing.",
    "Keep answers concise, useful, and action-oriented for a farmer or farm manager.",
    "Flag risky fertilizer or treatment actions carefully and suggest consulting an agronomist when appropriate.",
    "",
    `Brand: ${siteData.brand || "AgriCure"}`,
    `Farm: ${siteData.profile?.farm || "Mandapam Demonstration Farm"}`,
    `User role: ${siteData.profile?.role || "Farm Manager"}`,
    `Overview title: ${dashboardData.overview?.title || "Current Soil Report"}`,
    `Soil status: ${dashboardData.overview?.status || "Unknown"}`,
    `Soil health score: ${dashboardData.overview?.soilHealth?.score || "Unknown"}%`,
    `Soil health message: ${dashboardData.overview?.soilHealth?.message || "Not available."}`,
    `Soil health support: ${dashboardData.overview?.soilHealth?.support || "Not available."}`,
    `Recommendation summary: ${dashboardData.recommendations?.summary || "Not available."}`,
    `Realtime updated at: ${dashboardData.realtime?.updatedAt || "Not available."}`,
    "",
    "Soil data:",
    soilSummary,
    "",
    "Organic recommendations:",
    organicRecommendations,
    "",
    "Inorganic recommendations:",
    inorganicRecommendations,
    "",
    "Realtime metrics:",
    realtimeMetrics
  ].join("\n");
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .slice(-10)
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const rawRole = String(entry.role || "").toLowerCase();
      const role =
        rawRole === "assistant" || rawRole === "model"
          ? "model"
          : rawRole === "user"
            ? "user"
            : null;
      const text = typeof entry.text === "string" ? entry.text.trim().slice(0, 2000) : "";

      if (!role || !text) {
        return null;
      }

      return {
        role,
        parts: [{ text }]
      };
    })
    .filter(Boolean);
}

function extractReplyText(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts;

  if (!Array.isArray(parts)) {
    return "";
  }

  return parts
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("")
    .trim();
}

async function generateChatReply({ message, history }) {
  if (!hasGeminiConfig()) {
    throw createGeminiError(
      "Gemini API is not configured. Add GEMINI_API_KEY to .env and restart the server.",
      503
    );
  }

  const [siteData, dashboardData] = await Promise.all([
    getSiteData(),
    getDashboardData()
  ]);
  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const response = await fetch(`${GEMINI_API_ROOT}/${model}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [
          {
            text: buildDashboardContext(siteData, dashboardData)
          }
        ]
      },
      contents: [
        ...normalizeHistory(history),
        {
          role: "user",
          parts: [{ text: message }]
        }
      ],
      generationConfig: {
        temperature: 0.5,
        topP: 0.9,
        maxOutputTokens: 420
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw createGeminiError(
      `Gemini request failed (${response.status} ${response.statusText}). ${errorText}`
    );
  }

  const payload = await response.json();
  const reply = extractReplyText(payload);

  if (!reply) {
    throw createGeminiError("Gemini returned an empty response.");
  }

  return {
    reply,
    model
  };
}

module.exports = {
  generateChatReply,
  hasGeminiConfig
};
