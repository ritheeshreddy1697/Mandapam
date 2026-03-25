const https = require("https");
const {
  GOVERNMENT_API_CACHE_TTL_MS,
  getOrFetchGovernmentApiValue
} = require("./govt-cache");

const VIKASPEDIA_BASE_URL = "https://en.vikaspedia.in";
const CENTRAL_FARMER_SCHEMES_PATH = "/schemesall/schemes-for-farmers";
const STATE_SCHEMES_INDEX_PATH = "/schemesall/state-specific-schemes";
const STATE_SCHEME_LIMIT = 4;
const CENTRAL_SCHEME_LIMIT = 4;
const INSURANCE_SCHEME_LIMIT = 3;

const FARMER_RELEVANCE_KEYWORDS = [
  "farmer",
  "farmers",
  "farming",
  "farm",
  "agriculture",
  "agricultural",
  "crop",
  "crops",
  "kisan",
  "krishi",
  "rythu",
  "raitha",
  "shetkari",
  "annadata",
  "irrigation",
  "soil",
  "seed",
  "fertilizer",
  "fertilisers",
  "subsidy",
  "subsidies",
  "horticulture",
  "livestock",
  "dairy",
  "fisher",
  "fisheries",
  "animal husbandry",
  "beekeeping",
  "natural farming",
  "organic farming",
  "free power supply",
  "tractor"
];

const INSURANCE_KEYWORDS = [
  "insurance",
  "bima",
  "assurance",
  "crop insurance",
  "accident insurance"
];

const PRIMARY_CENTRAL_SCHEME_KEYWORDS = [
  "kisan",
  "krishi",
  "agriculture",
  "farmers",
  "farmer",
  "farming",
  "irrigation",
  "organic farming",
  "natural farming",
  "credit",
  "soil"
];

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "AgriCure/1.0"
        }
      },
      (response) => {
        let body = "";

        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(new Error(`Vikaspedia request failed with status ${response.statusCode}.`));
            return;
          }

          resolve(body);
        });
      }
    );

    request.setTimeout(15000, () => {
      request.destroy(new Error("Vikaspedia request timed out."));
    });
    request.on("error", reject);
  });
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&ldquo;|&rdquo;/gi, '"')
    .replace(/&lsquo;|&rsquo;/gi, "'")
    .replace(/&ndash;|&#8211;/gi, "-")
    .replace(/&mdash;|&#8212;/gi, "-")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, codePoint) => String.fromCharCode(Number(codePoint)));
}

function stripTags(value) {
  return decodeHtml(String(value || "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value) {
  return stripTags(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function buildPageUrl(contextPath) {
  return `${VIKASPEDIA_BASE_URL}/viewcontent${contextPath}?lgn=en`;
}

function extractNextData(html) {
  const match = String(html || "").match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
  );

  if (!match) {
    throw new Error("Vikaspedia page payload was not found.");
  }

  return JSON.parse(match[1]);
}

async function fetchVikaspediaPage(contextPath) {
  const normalizedPath = String(contextPath || "").startsWith("/")
    ? String(contextPath || "")
    : `/${String(contextPath || "")}`;
  const cacheKey = `vikaspedia:page:${normalizedPath}`;

  return getOrFetchGovernmentApiValue(
    cacheKey,
    async () => {
      const html = await fetchText(buildPageUrl(normalizedPath));
      return extractNextData(html)?.props?.pageProps || {};
    },
    GOVERNMENT_API_CACHE_TTL_MS
  );
}

async function getFolderEntries(contextPath) {
  const page = await fetchVikaspediaPage(contextPath);
  return Array.isArray(page?.ssrContentList) ? page.ssrContentList : [];
}

async function getDocumentContent(contextPath) {
  const page = await fetchVikaspediaPage(contextPath);
  return page?.ssrPageContent || null;
}

function slugify(value) {
  return normalizeText(value).replace(/\s+/g, "-");
}

function scoreKeywordHits(text, keywords) {
  return keywords.reduce((score, keyword) => {
    const normalizedKeyword = normalizeText(keyword);

    if (!normalizedKeyword) {
      return score;
    }

    if (!text.includes(normalizedKeyword)) {
      return score;
    }

    return score + 2 + normalizedKeyword.length / 50;
  }, 0);
}

function isInsuranceScheme(entry) {
  const haystack = normalizeText(
    `${entry?.title || ""} ${entry?.summery || ""} ${entry?.context_path || ""}`
  );

  return INSURANCE_KEYWORDS.some((keyword) => haystack.includes(normalizeText(keyword)));
}

function scoreFarmerScheme(entry) {
  const titleText = normalizeText(entry?.title);
  const summaryText = normalizeText(entry?.summery);
  const pathText = normalizeText(entry?.context_path);
  const text = `${titleText} ${summaryText} ${pathText}`.trim();

  let score = scoreKeywordHits(text, FARMER_RELEVANCE_KEYWORDS);

  if (titleText.includes("scheme")) {
    score += 0.5;
  }

  if (summaryText.includes("farmers")) {
    score += 1.5;
  }

  return score;
}

function scorePrimaryCentralScheme(entry) {
  const titleText = normalizeText(entry?.title);
  const summaryText = normalizeText(entry?.summery);
  const text = `${titleText} ${summaryText}`.trim();
  let score = scoreKeywordHits(text, PRIMARY_CENTRAL_SCHEME_KEYWORDS);

  if (titleText.includes("kisan")) {
    score += 6;
  }

  if (titleText.includes("krishi")) {
    score += 5;
  }

  if (titleText.includes("agriculture")) {
    score += 4;
  }

  if (titleText.includes("farmer")) {
    score += 3;
  }

  if (titleText.includes("fisher")) {
    score -= 2;
  }

  if (titleText.includes("animal husbandry")) {
    score -= 1.5;
  }

  return score;
}

function compareByUpdatedAt(left, right) {
  const leftTime = Date.parse(left?.updated_at || left?.created_at || 0) || 0;
  const rightTime = Date.parse(right?.updated_at || right?.created_at || 0) || 0;

  return rightTime - leftTime;
}

function selectTopSchemeEntries(entries, options = {}) {
  const {
    limit = 4,
    includeInsurance = false,
    farmerFocused = false,
    centralFocused = false
  } = options;

  return (Array.isArray(entries) ? entries : [])
    .filter((entry) => entry?.context_type === "document")
    .filter((entry) => (includeInsurance ? isInsuranceScheme(entry) : !isInsuranceScheme(entry)))
    .map((entry) => ({
      ...entry,
      farmerScore: scoreFarmerScheme(entry),
      centralScore: centralFocused ? scorePrimaryCentralScheme(entry) : 0
    }))
    .filter((entry) => (farmerFocused ? entry.farmerScore > 0 : true))
    .sort(
      (left, right) =>
        right.centralScore - left.centralScore ||
        right.farmerScore - left.farmerScore ||
        compareByUpdatedAt(left, right) ||
        String(left.title || "").localeCompare(String(right.title || ""))
    )
    .slice(0, limit);
}

function scoreStateFolderMatch(entry, requestedStateName) {
  const normalizedState = normalizeText(requestedStateName);

  if (!normalizedState || entry?.context_type !== "folder") {
    return 0;
  }

  const titleText = normalizeText(entry.title);
  const summaryText = normalizeText(entry.summery);
  const pathText = slugify(entry.context_path);
  const stateSlug = slugify(requestedStateName);

  let score = 0;

  if (titleText.includes(normalizedState)) {
    score += 8;
  }

  if (summaryText.includes(normalizedState)) {
    score += 4;
  }

  if (pathText.includes(stateSlug)) {
    score += 10;
  }

  return score;
}

function resolveStateFolderEntry(entries, stateName) {
  return (Array.isArray(entries) ? entries : [])
    .map((entry) => ({
      ...entry,
      stateScore: scoreStateFolderMatch(entry, stateName)
    }))
    .filter((entry) => entry.stateScore > 0)
    .sort(
      (left, right) =>
        right.stateScore - left.stateScore ||
        compareByUpdatedAt(left, right) ||
        String(left.title || "").localeCompare(String(right.title || ""))
    )[0] || null;
}

function extractHighlightsFromHtml(content, summary) {
  const fragments = [];
  const matches = String(content || "").matchAll(/<(li|p)[^>]*>([\s\S]*?)<\/\1>/gi);

  for (const match of matches) {
    const cleaned = stripTags(match[2]);

    if (!cleaned || cleaned.length < 18) {
      continue;
    }

    if (normalizeText(cleaned) === normalizeText(summary)) {
      continue;
    }

    if (/^source\s*[:-]/i.test(cleaned)) {
      continue;
    }

    fragments.push(cleaned);
  }

  return Array.from(new Set(fragments)).slice(0, 4);
}

function extractExternalLinks(content) {
  return Array.from(
    new Set(
      [...String(content || "").matchAll(/href="(https?:\/\/[^"]+)"/gi)].map((match) => match[1])
    )
  ).slice(0, 2);
}

async function buildSchemeRecord(entry, scope, stateName) {
  const pageContent = await getDocumentContent(entry.context_path);
  const officialLinks = extractExternalLinks(pageContent?.content);

  return {
    title: pageContent?.title || entry.title || "",
    summary: pageContent?.summery || entry.summery || "",
    highlights: extractHighlightsFromHtml(pageContent?.content, pageContent?.summery || entry.summery),
    sourceUrl: buildPageUrl(entry.context_path),
    officialUrl: officialLinks[0] || "",
    updatedAt: pageContent?.updated_at || entry.updated_at || entry.created_at || "",
    scope,
    stateName: stateName || "",
    source: "Vikaspedia"
  };
}

async function buildSchemeRecords(entries, scope, stateName) {
  return Promise.all(
    (Array.isArray(entries) ? entries : []).map((entry) => buildSchemeRecord(entry, scope, stateName))
  );
}

async function getVikaspediaSchemeInsights(stateName) {
  const centralEntries = await getFolderEntries(CENTRAL_FARMER_SCHEMES_PATH);
  const centralSchemes = await buildSchemeRecords(
    selectTopSchemeEntries(centralEntries, {
      limit: CENTRAL_SCHEME_LIMIT,
      includeInsurance: false,
      farmerFocused: false,
      centralFocused: true
    }),
    "central",
    ""
  );
  const centralInsuranceSchemes = await buildSchemeRecords(
    selectTopSchemeEntries(centralEntries, {
      limit: INSURANCE_SCHEME_LIMIT,
      includeInsurance: true,
      farmerFocused: false
    }),
    "central-insurance",
    ""
  );

  let selectedState = "";
  let stateSchemes = [];
  let stateInsuranceSchemes = [];

  if (stateName) {
    const stateFolders = await getFolderEntries(STATE_SCHEMES_INDEX_PATH);
    const stateFolder = resolveStateFolderEntry(stateFolders, stateName);

    if (stateFolder) {
      selectedState = stateName;

      const stateEntries = await getFolderEntries(stateFolder.context_path);
      stateSchemes = await buildSchemeRecords(
        selectTopSchemeEntries(stateEntries, {
          limit: STATE_SCHEME_LIMIT,
          includeInsurance: false,
          farmerFocused: true
        }),
        "state",
        stateName
      );
      stateInsuranceSchemes = await buildSchemeRecords(
        selectTopSchemeEntries(stateEntries, {
          limit: INSURANCE_SCHEME_LIMIT,
          includeInsurance: true,
          farmerFocused: false
        }),
        "state-insurance",
        stateName
      );
    }
  }

  return {
    source: "vikaspedia",
    sourceUrl: buildPageUrl(CENTRAL_FARMER_SCHEMES_PATH),
    selectedState,
    centralSchemes,
    stateSchemes,
    insuranceSchemes: {
      central: centralInsuranceSchemes,
      state: stateInsuranceSchemes
    }
  };
}

module.exports = {
  getVikaspediaSchemeInsights
};
