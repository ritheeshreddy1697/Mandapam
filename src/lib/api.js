const RAW_API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "").trim();

function createApiError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeApiBaseUrl(value) {
  return value.replace(/\/+$/, "");
}

function buildApiUrl(pathname) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const apiBaseUrl = normalizeApiBaseUrl(RAW_API_BASE_URL);
  return apiBaseUrl ? `${apiBaseUrl}${normalizedPath}` : normalizedPath;
}

function looksLikeJson(text) {
  const normalizedText = String(text || "").trim();
  return normalizedText.startsWith("{") || normalizedText.startsWith("[");
}

function buildHtmlResponseError(apiPath, apiBaseUrl) {
  if (apiBaseUrl) {
    return createApiError(
      "API_HTML_RESPONSE",
      `The API at ${apiBaseUrl}${apiPath} returned HTML instead of JSON. Check that the backend deployment is serving this route.`
    );
  }

  return createApiError(
    "API_UNREACHABLE",
    "The deployed app could not reach its API. Make sure `/api/*` routes are deployed with the frontend, or set `VITE_API_BASE_URL` to a live backend URL."
  );
}

export function getApiUrl(pathname) {
  return buildApiUrl(pathname);
}

export async function requestJson(pathname, options = {}) {
  const apiUrl = buildApiUrl(pathname);
  let response;

  try {
    response = await fetch(apiUrl, options);
  } catch {
    throw createApiError(
      "API_FETCH_FAILED",
      "Unable to reach the API right now. Please try again."
    );
  }

  const contentType = response.headers.get("content-type") || "";
  const rawBody = await response.text();

  if (!rawBody) {
    return {
      response,
      payload: null
    };
  }

  if (!contentType.includes("application/json") && !looksLikeJson(rawBody)) {
    throw buildHtmlResponseError(pathname, normalizeApiBaseUrl(RAW_API_BASE_URL));
  }

  try {
    return {
      response,
      payload: JSON.parse(rawBody)
    };
  } catch {
    throw createApiError(
      "API_INVALID_JSON",
      "The server returned an invalid JSON response."
    );
  }
}
