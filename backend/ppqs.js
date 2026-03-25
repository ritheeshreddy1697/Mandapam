const https = require("https");
const {
  GOVERNMENT_API_CACHE_TTL_MS,
  getOrFetchGovernmentApiValue
} = require("./govt-cache");

const PPQS_BASE_URL = "https://ppqs.gov.in/en/advisories-section";
const PPQS_SOURCE_URL = "https://ppqs.gov.in/en/advisories-section";
const PPQS_MAX_PAGES = 5;

const CROP_KEYWORDS = {
  paddy: ["rice", "paddy", "stem borer", "leaf folder", "blast", "brown plant hopper"],
  wheat: ["wheat", "yellow rust", "stem borer"],
  corn: ["maize", "fall army worm", "stem borer"],
  soybean: ["soybean", "yellow mosaic virus", "hairy caterpillar"],
  mustard: ["mustard", "white rust"],
  chickpea: ["chickpea", "gram", "pod borer", "soil borne"],
  cotton: ["cotton", "pink boll worm", "white fly", "sucking pests", "thrips"],
  banana: ["banana", "cucumber mosaic virus"]
};

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
            reject(new Error(`PPQS request failed with status ${response.statusCode}.`));
            return;
          }

          resolve(body);
        });
      }
    );

    request.setTimeout(12000, () => {
      request.destroy(new Error("PPQS request timed out."));
    });
    request.on("error", reject);
  });
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&ldquo;|&rdquo;/gi, '"')
    .replace(/&lsquo;|&rsquo;/gi, "'");
}

function stripTags(value) {
  return decodeHtml(String(value || "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value) {
  return stripTags(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function extractAdvisoriesFromHtml(html) {
  const rows = [
    ...String(html || "").matchAll(
      /<tr[^>]*>\s*<td[^>]*>\s*\d+\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>[\s\S]*?Download/gi
    )
  ];

  return rows.map((match) => ({
    title: stripTags(match[1]),
    href: match[2].startsWith("http") ? match[2] : `https://ppqs.gov.in${match[2]}`,
    source: "PPQS",
    sourceUrl: PPQS_SOURCE_URL
  }));
}

async function fetchAdvisoryPage(pageIndex) {
  const cacheKey = `ppqs:page:${pageIndex}`;
  return getOrFetchGovernmentApiValue(
    cacheKey,
    async () => {
      const url = pageIndex > 0 ? `${PPQS_BASE_URL}?page=${pageIndex}` : PPQS_BASE_URL;
      const html = await fetchText(url);
      return extractAdvisoriesFromHtml(html);
    },
    GOVERNMENT_API_CACHE_TTL_MS
  );
}

async function getAllAdvisories() {
  const cacheKey = "ppqs:all-advisories";
  return getOrFetchGovernmentApiValue(
    cacheKey,
    async () => {
      const pages = await Promise.all(
        Array.from({ length: PPQS_MAX_PAGES }, (_, index) => fetchAdvisoryPage(index))
      );

      return pages
        .flat()
        .filter((item) => item.title && item.href);
    },
    GOVERNMENT_API_CACHE_TTL_MS
  );
}

function scoreAdvisory(title, keywords = []) {
  const normalizedTitle = normalizeText(title);
  return keywords.reduce((score, keyword) => {
    const normalizedKeyword = normalizeText(keyword);

    if (!normalizedKeyword) {
      return score;
    }

    return normalizedTitle.includes(normalizedKeyword) ? score + 2 + normalizedKeyword.length / 100 : score;
  }, 0);
}

async function getPpqsAdvisoriesForCrop(cropKey) {
  const keywords = CROP_KEYWORDS[cropKey] || [];

  if (keywords.length === 0) {
    return {
      cropKey,
      advisories: [],
      source: "PPQS",
      sourceUrl: PPQS_SOURCE_URL
    };
  }

  const advisories = await getAllAdvisories();
  const matched = advisories
    .map((advisory) => ({
      ...advisory,
      score: scoreAdvisory(advisory.title, keywords)
    }))
    .filter((advisory) => advisory.score > 0)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
    .slice(0, 4)
    .map(({ score, ...advisory }) => advisory);

  return {
    cropKey,
    advisories: matched,
    source: "PPQS",
    sourceUrl: PPQS_SOURCE_URL
  };
}

module.exports = {
  getPpqsAdvisoriesForCrop
};
