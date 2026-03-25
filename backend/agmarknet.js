const https = require("https");
const {
  GOVERNMENT_API_CACHE_TTL_MS,
  getOrFetchGovernmentApiValue
} = require("./govt-cache");

const API_BASE_URL = "https://api.agmarknet.gov.in/v1";
const AGMARKNET_HOME_URL = "https://agmarknet.gov.in/home";

const CROP_MARKET_CONFIG = {
  paddy: {
    searchTerms: ["Paddy(Common)", "Paddy"],
    preferredMarkets: [
      { marketIncludes: "Vijayawada", stateName: "Andhra Pradesh" },
      { marketIncludes: "Kakinada", stateName: "Andhra Pradesh" },
      { marketIncludes: "Raichur", stateName: "Karnataka" }
    ]
  },
  wheat: {
    searchTerms: ["Wheat"],
    preferredMarkets: [
      { marketIncludes: "Kota", stateName: "Rajasthan" },
      { marketIncludes: "Indore", stateName: "Madhya Pradesh" },
      { marketIncludes: "Ujjain", stateName: "Madhya Pradesh" }
    ]
  },
  barley: {
    searchTerms: ["Barley"],
    preferredMarkets: [
      { marketIncludes: "Jaipur", stateName: "Rajasthan" },
      { marketIncludes: "Kota", stateName: "Rajasthan" },
      { marketIncludes: "Indore", stateName: "Madhya Pradesh" }
    ]
  },
  corn: {
    searchTerms: ["Maize", "Corn"],
    preferredMarkets: [
      { marketIncludes: "Davanagere", stateName: "Karnataka" },
      { marketIncludes: "Davangere", stateName: "Karnataka" },
      { marketIncludes: "Guntur", stateName: "Andhra Pradesh" }
    ]
  },
  sorghum: {
    searchTerms: ["Jowar(Sorghum)", "Jowar"],
    preferredMarkets: [
      { marketIncludes: "Davanagere", stateName: "Karnataka" },
      { marketIncludes: "Nagpur", stateName: "Maharashtra" },
      { marketIncludes: "Indore", stateName: "Madhya Pradesh" }
    ]
  },
  millet: {
    searchTerms: ["Bajra(Pearl Millet/Cumbu)", "Bajra"],
    preferredMarkets: [
      { marketIncludes: "Jaipur", stateName: "Rajasthan" },
      { marketIncludes: "Kota", stateName: "Rajasthan" },
      { marketIncludes: "Nagpur", stateName: "Maharashtra" }
    ]
  },
  oats: {
    searchTerms: ["Oats"],
    preferredMarkets: [
      { marketIncludes: "Jaipur", stateName: "Rajasthan" },
      { marketIncludes: "Indore", stateName: "Madhya Pradesh" },
      { marketIncludes: "Ujjain", stateName: "Madhya Pradesh" }
    ]
  },
  chickpea: {
    searchTerms: ["Bengal Gram(Gram)(Whole)", "Gram"],
    preferredMarkets: [
      { marketIncludes: "Indore", stateName: "Madhya Pradesh" },
      { marketIncludes: "Kota", stateName: "Rajasthan" },
      { marketIncludes: "Ujjain", stateName: "Madhya Pradesh" }
    ]
  },
  "black-gram": {
    searchTerms: ["Black Gram (Urd Beans)(Whole)", "Urd"],
    preferredMarkets: [
      { marketIncludes: "Guntur", stateName: "Andhra Pradesh" },
      { marketIncludes: "Indore", stateName: "Madhya Pradesh" },
      { marketIncludes: "Nagpur", stateName: "Maharashtra" }
    ]
  },
  "green-gram": {
    searchTerms: ["Green Gram (Moong)(Whole)", "Moong"],
    preferredMarkets: [
      { marketIncludes: "Guntur", stateName: "Andhra Pradesh" },
      { marketIncludes: "Indore", stateName: "Madhya Pradesh" },
      { marketIncludes: "Nagpur", stateName: "Maharashtra" }
    ]
  },
  groundnut: {
    searchTerms: ["Groundnut", "Ground Nut"],
    preferredMarkets: [
      { marketIncludes: "Guntur", stateName: "Andhra Pradesh" },
      { marketIncludes: "Nagpur", stateName: "Maharashtra" },
      { marketIncludes: "Indore", stateName: "Madhya Pradesh" }
    ]
  },
  soybean: {
    searchTerms: ["Soyabean", "Soybean"],
    preferredMarkets: [
      { marketIncludes: "Indore", stateName: "Madhya Pradesh" },
      { marketIncludes: "Ujjain", stateName: "Madhya Pradesh" },
      { marketIncludes: "Nagpur", stateName: "Maharashtra" }
    ]
  },
  mustard: {
    searchTerms: ["Mustard", "Mustard Seed"],
    preferredMarkets: [
      { marketIncludes: "Jaipur", stateName: "Rajasthan" },
      { marketIncludes: "Kota", stateName: "Rajasthan" },
      { marketIncludes: "Indore", stateName: "Madhya Pradesh" }
    ]
  },
  sunflower: {
    searchTerms: ["Sunflower"],
    preferredMarkets: [
      { marketIncludes: "Davanagere", stateName: "Karnataka" },
      { marketIncludes: "Nagpur", stateName: "Maharashtra" },
      { marketIncludes: "Indore", stateName: "Madhya Pradesh" }
    ]
  },
  cotton: {
    searchTerms: ["Cotton"],
    preferredMarkets: [
      { marketIncludes: "Abohar", stateName: "Punjab" },
      { marketIncludes: "Nagpur", stateName: "Maharashtra" },
      { marketIncludes: "Indore", stateName: "Madhya Pradesh" }
    ]
  },
  turmeric: {
    searchTerms: ["Turmeric"],
    preferredMarkets: [
      { marketIncludes: "Guntur", stateName: "Andhra Pradesh" },
      { marketIncludes: "Nizamabad", stateName: "Telangana" },
      { marketIncludes: "Mysore", stateName: "Karnataka" }
    ]
  },
  tomato: {
    searchTerms: ["Tomato"],
    preferredMarkets: [
      { marketIncludes: "Kolar", stateName: "Karnataka" },
      { marketIncludes: "Madanapalle", stateName: "Andhra Pradesh" },
      { marketIncludes: "Mysore", stateName: "Karnataka" }
    ]
  },
  onion: {
    searchTerms: ["Onion"],
    preferredMarkets: [
      { marketIncludes: "Lasalgaon", stateName: "Maharashtra" },
      { marketIncludes: "Nashik", stateName: "Maharashtra" },
      { marketIncludes: "Kolar", stateName: "Karnataka" }
    ]
  },
  potato: {
    searchTerms: ["Potato"],
    preferredMarkets: [
      { marketIncludes: "Agra", stateName: "Uttar Pradesh" },
      { marketIncludes: "Indore", stateName: "Madhya Pradesh" },
      { marketIncludes: "Kolar", stateName: "Karnataka" }
    ]
  },
  brinjal: {
    searchTerms: ["Brinjal"],
    preferredMarkets: [
      { marketIncludes: "Kolar", stateName: "Karnataka" },
      { marketIncludes: "Mysore", stateName: "Karnataka" },
      { marketIncludes: "Madanapalle", stateName: "Andhra Pradesh" }
    ]
  },
  okra: {
    searchTerms: ["Bhindi(Ladies Finger)", "Ladies Finger", "Bhindi"],
    preferredMarkets: [
      { marketIncludes: "Kolar", stateName: "Karnataka" },
      { marketIncludes: "Mysore", stateName: "Karnataka" },
      { marketIncludes: "Guntur", stateName: "Andhra Pradesh" }
    ]
  },
  chilli: {
    searchTerms: ["Chillies", "Green Chilli"],
    preferredMarkets: [
      { marketIncludes: "Guntur", stateName: "Andhra Pradesh" },
      { marketIncludes: "Mysore", stateName: "Karnataka" },
      { marketIncludes: "Kolar", stateName: "Karnataka" }
    ]
  },
  cabbage: {
    searchTerms: ["Cabbage"],
    preferredMarkets: [
      { marketIncludes: "Kolar", stateName: "Karnataka" },
      { marketIncludes: "Mysore", stateName: "Karnataka" },
      { marketIncludes: "Madanapalle", stateName: "Andhra Pradesh" }
    ]
  },
  cauliflower: {
    searchTerms: ["Cauliflower"],
    preferredMarkets: [
      { marketIncludes: "Kolar", stateName: "Karnataka" },
      { marketIncludes: "Mysore", stateName: "Karnataka" },
      { marketIncludes: "Madanapalle", stateName: "Andhra Pradesh" }
    ]
  },
  carrot: {
    searchTerms: ["Carrot"],
    preferredMarkets: [
      { marketIncludes: "Kolar", stateName: "Karnataka" },
      { marketIncludes: "Mysore", stateName: "Karnataka" },
      { marketIncludes: "Jaipur", stateName: "Rajasthan" }
    ]
  },
  cucumber: {
    searchTerms: ["Cucumbar(Kheera)", "Cucumber", "Kheera"],
    preferredMarkets: [
      { marketIncludes: "Kolar", stateName: "Karnataka" },
      { marketIncludes: "Mysore", stateName: "Karnataka" },
      { marketIncludes: "Madanapalle", stateName: "Andhra Pradesh" }
    ]
  },
  spinach: {
    searchTerms: ["Spinach"],
    preferredMarkets: [
      { marketIncludes: "Kolar", stateName: "Karnataka" },
      { marketIncludes: "Mysore", stateName: "Karnataka" },
      { marketIncludes: "Madanapalle", stateName: "Andhra Pradesh" }
    ]
  },
  beans: {
    searchTerms: ["Beans"],
    preferredMarkets: [
      { marketIncludes: "Kolar", stateName: "Karnataka" },
      { marketIncludes: "Mysore", stateName: "Karnataka" },
      { marketIncludes: "Madanapalle", stateName: "Andhra Pradesh" }
    ]
  },
  peas: {
    searchTerms: ["Peas Wet", "Peas(Dry)"],
    preferredMarkets: [
      { marketIncludes: "Kolar", stateName: "Karnataka" },
      { marketIncludes: "Jaipur", stateName: "Rajasthan" },
      { marketIncludes: "Indore", stateName: "Madhya Pradesh" }
    ]
  },
  "bottle-gourd": {
    searchTerms: ["Bottle gourd", "Bottle Gourd"],
    preferredMarkets: [
      { marketIncludes: "Kolar", stateName: "Karnataka" },
      { marketIncludes: "Mysore", stateName: "Karnataka" },
      { marketIncludes: "Madanapalle", stateName: "Andhra Pradesh" }
    ]
  },
  pumpkin: {
    searchTerms: ["Pumpkin"],
    preferredMarkets: [
      { marketIncludes: "Kolar", stateName: "Karnataka" },
      { marketIncludes: "Mysore", stateName: "Karnataka" },
      { marketIncludes: "Madanapalle", stateName: "Andhra Pradesh" }
    ]
  }
};

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          Accept: "application/json",
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
            reject(
              new Error(`Agmarknet request failed with status ${response.statusCode}.`)
            );
            return;
          }

          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(new Error("Agmarknet returned invalid JSON."));
          }
        });
      }
    );

    request.setTimeout(12000, () => {
      request.destroy(new Error("Agmarknet request timed out."));
    });
    request.on("error", reject);
  });
}

async function getMarketDirectory() {
  const cacheKey = "agmark:market-directory";
  return getOrFetchGovernmentApiValue(
    cacheKey,
    async () => {
      const payload = await fetchJson(`${API_BASE_URL}/market-district-state`);
      return Array.isArray(payload) ? payload : [];
    },
    GOVERNMENT_API_CACHE_TTL_MS
  );
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function uniqueBy(items, getKey) {
  const seen = new Set();
  return items.filter((item) => {
    const key = getKey(item);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function pickBestCommodityMatch(items, searchTerm) {
  const normalizedSearch = normalizeText(searchTerm);
  const directMatch = items.find(
    (item) => normalizeText(item.cmdt_name) === normalizedSearch
  );

  if (directMatch) {
    return directMatch;
  }

  return (
    items.find((item) => normalizeText(item.cmdt_name).includes(normalizedSearch)) ||
    items[0] ||
    null
  );
}

async function searchCommodity(searchTerm) {
  const normalizedSearch = normalizeText(searchTerm);
  const cacheKey = `agmark:commodity-search:${normalizedSearch}`;
  return getOrFetchGovernmentApiValue(
    cacheKey,
    async () => {
      const url = `${API_BASE_URL}/commodities?search=${encodeURIComponent(searchTerm)}`;
      const payload = await fetchJson(url);
      const items = Array.isArray(payload?.data) ? payload.data : [];
      return pickBestCommodityMatch(items, searchTerm);
    },
    GOVERNMENT_API_CACHE_TTL_MS
  );
}

async function resolveCommodityForCrop(cropKey) {
  const config = CROP_MARKET_CONFIG[cropKey];

  if (!config?.searchTerms?.length) {
    return null;
  }

  for (const searchTerm of config.searchTerms) {
    const commodity = await searchCommodity(searchTerm);

    if (commodity) {
      return commodity;
    }
  }

  return null;
}

function resolvePreferredMarkets(markets, preferredMarkets) {
  if (!Array.isArray(markets) || !Array.isArray(preferredMarkets)) {
    return [];
  }

  return preferredMarkets
    .map((target) =>
      markets.find((market) => {
        const marketName = normalizeText(market.market_name);
        const stateName = normalizeText(market.state_name);

        return (
          marketName.includes(normalizeText(target.marketIncludes)) &&
          (!target.stateName || stateName === normalizeText(target.stateName))
        );
      })
    )
    .filter(Boolean);
}

function filterMarketsByLocation(markets, options = {}) {
  const normalizedState = normalizeText(options.stateName);
  const normalizedDistrict = normalizeText(options.districtName);

  return markets.filter((market) => {
    const stateMatches = !normalizedState || normalizeText(market.state_name) === normalizedState;
    const districtMatches =
      !normalizedDistrict || normalizeText(market.district_name) === normalizedDistrict;

    return stateMatches && districtMatches;
  });
}

function resolveCandidateMarkets(markets, cropKey, options = {}) {
  const config = CROP_MARKET_CONFIG[cropKey];
  const scopedMarkets = filterMarketsByLocation(markets, options);
  const marketPool = scopedMarkets.length > 0 ? scopedMarkets : markets;
  const preferredMarkets = resolvePreferredMarkets(marketPool, config?.preferredMarkets);

  return uniqueBy([...preferredMarkets, ...marketPool], (market) => market.market_id).slice(0, 32);
}

function buildLocationCacheKey(stateName, districtName) {
  return `${normalizeText(stateName) || "all"}:${normalizeText(districtName) || "all"}`;
}

function toNumber(value) {
  if (value === null || value === undefined || value === "" || value === "NR") {
    return null;
  }

  const numericValue = Number.parseFloat(String(value).replace(/,/g, ""));
  return Number.isFinite(numericValue) ? numericValue : null;
}

function rowsUnit(report) {
  const rows = Array.isArray(report?.data) ? report.data : [];
  return rows.find((row) => row?.unitOfPrice && row.unitOfPrice !== "NR")?.unitOfPrice || "Quintal";
}

function buildSeriesFromReport(report) {
  const rows = Array.isArray(report?.data) ? report.data : [];
  const columns = Array.isArray(report?.columns) ? report.columns : [];
  const dateKeys = columns
    .map((column) => column.key)
    .filter((key) => /^\d{4}-\d{2}-\d{2}$/.test(key));

  return dateKeys
    .map((dateKey) => {
      const values = rows
        .map((row) => toNumber(row?.[dateKey]))
        .filter((value) => value !== null);

      if (values.length === 0) {
        return null;
      }

      const total = values.reduce((sum, value) => sum + value, 0);
      return {
        date: dateKey,
        value: Number((total / values.length).toFixed(2))
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.date.localeCompare(right.date));
}

function buildInsightFromReport(cropKey, commodity, market, report) {
  const series = buildSeriesFromReport(report);

  if (series.length === 0) {
    return null;
  }

  const latest = series[series.length - 1];
  const previous = series.length > 1 ? series[series.length - 2] : null;
  const priceChange = previous ? Number((latest.value - previous.value).toFixed(2)) : null;

  return {
    cropKey,
    commodityId: commodity.id,
    commodityName: commodity.cmdt_name,
    marketId: market.market_id,
    marketName: market.market_name,
    districtName: market.district_name,
    stateId: market.state_id,
    stateName: market.state_name,
    latestPrice: latest.value,
    previousPrice: previous?.value ?? null,
    priceChange,
    priceDirection:
      priceChange === null ? "steady" : priceChange > 0 ? "up" : priceChange < 0 ? "down" : "steady",
    lastReportedDate: latest.date,
    priceUnit: series.length > 0 ? rowsUnit(report) : commodity.price_unit_name || "Quintal",
    title: report?.title || "",
    series,
    source: "Agmarknet",
    sourceUrl: AGMARKNET_HOME_URL
  };
}

async function fetchLastWeekReport(commodityId, stateId, marketId) {
  const url =
    `${API_BASE_URL}/prices-and-arrivals/commodity-price/lastweek?` +
    `commodityId=${encodeURIComponent(commodityId)}` +
    `&stateId=${encodeURIComponent(stateId)}` +
    `&marketId=${encodeURIComponent(marketId)}`;

  return fetchJson(url);
}

async function fetchCropInsight(cropKey, options = {}) {
  const cacheKey = `agmark:crop-insight:${cropKey}:${buildLocationCacheKey(
    options.stateName,
    options.districtName
  )}`;
  return getOrFetchGovernmentApiValue(
    cacheKey,
    async () => {
      const config = CROP_MARKET_CONFIG[cropKey];

      if (!config) {
        return null;
      }

      const [commodity, markets] = await Promise.all([
        resolveCommodityForCrop(cropKey),
        getMarketDirectory()
      ]);

      if (!commodity) {
        return null;
      }

      const candidateMarkets = resolveCandidateMarkets(markets, cropKey, options);

      for (const market of candidateMarkets) {
        try {
          const report = await fetchLastWeekReport(commodity.id, market.state_id, market.market_id);

          if (report?.success) {
            const insight = buildInsightFromReport(cropKey, commodity, market, report);

            if (insight) {
              return insight;
            }
          }
        } catch (error) {
          continue;
        }
      }

      return null;
    },
    GOVERNMENT_API_CACHE_TTL_MS
  );
}

function buildLocationDirectory(markets) {
  const byState = new Map();

  markets.forEach((market) => {
    const stateKey = normalizeText(market.state_name);

    if (!byState.has(stateKey)) {
      byState.set(stateKey, {
        id: market.state_id,
        name: market.state_name,
        districts: new Map()
      });
    }

    const state = byState.get(stateKey);
    const districtKey = normalizeText(market.district_name);

    if (!state.districts.has(districtKey)) {
      state.districts.set(districtKey, {
        id: market.district_id,
        name: market.district_name
      });
    }
  });

  return Array.from(byState.values())
    .map((state) => ({
      id: state.id,
      name: state.name,
      districts: Array.from(state.districts.values()).sort((left, right) =>
        left.name.localeCompare(right.name)
      )
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

async function getAgmarknetLocations() {
  const cacheKey = "agmark:location-directory";
  return getOrFetchGovernmentApiValue(
    cacheKey,
    async () => {
      const markets = await getMarketDirectory();
      return {
        states: buildLocationDirectory(markets)
      };
    },
    GOVERNMENT_API_CACHE_TTL_MS
  );
}

function resolveStateRecord(markets, stateName) {
  const normalizedState = normalizeText(stateName);

  if (!normalizedState) {
    return null;
  }

  const match = markets.find((market) => normalizeText(market.state_name) === normalizedState);

  if (!match) {
    return null;
  }

  return {
    stateId: match.state_id,
    stateName: match.state_name
  };
}

function parseArrivalDate(value) {
  const match = String(value || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) {
    return "";
  }

  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

function buildMarketLookup(markets, stateName) {
  const lookup = new Map();
  const normalizedState = normalizeText(stateName);

  markets.forEach((market) => {
    if (normalizedState && normalizeText(market.state_name) !== normalizedState) {
      return;
    }

    const key = normalizeText(market.market_name);
    const existing = lookup.get(key) || [];
    lookup.set(key, [...existing, market]);
  });

  return lookup;
}

async function fetchDateWiseCommodityReport({ year, month, stateId, commodityId, liveDate }) {
  const monthValue = String(month).padStart(2, "0");
  const liveDateValue = liveDate || new Date().toISOString().slice(0, 10);
  const cacheKey = `agmark:date-wise:${year}:${monthValue}:${stateId}:${commodityId}:${liveDateValue}`;
  return getOrFetchGovernmentApiValue(
    cacheKey,
    async () => {
      const url =
        `${API_BASE_URL}/prices-and-arrivals/date-wise/specific-commodity?` +
        `year=${encodeURIComponent(year)}` +
        `&month=${encodeURIComponent(monthValue)}` +
        `&stateId=${encodeURIComponent(stateId)}` +
        `&commodityId=${encodeURIComponent(commodityId)}` +
        `&liveDate=${encodeURIComponent(liveDateValue)}`;
      return fetchJson(url);
    },
    GOVERNMENT_API_CACHE_TTL_MS
  );
}

function flattenCommodityDateWiseReport(report, markets, stateName) {
  const lookup = buildMarketLookup(markets, stateName);
  const marketBlocks = Array.isArray(report?.markets) ? report.markets : [];
  const rows = [];

  marketBlocks.forEach((marketBlock) => {
    const marketName = marketBlock?.marketName || "";
    const linkedMarkets = lookup.get(normalizeText(marketName)) || [];
    const districtName = linkedMarkets[0]?.district_name || "";
    const dates = Array.isArray(marketBlock?.dates) ? marketBlock.dates : [];

    dates.forEach((dateBlock) => {
      const reportedOn = parseArrivalDate(dateBlock?.arrivalDate);
      const totalArrivals = toNumber(dateBlock?.total_arrivals) || 0;
      const dataRows = Array.isArray(dateBlock?.data) ? dateBlock.data : [];

      dataRows.forEach((dataRow) => {
        rows.push({
          marketName,
          districtName,
          reportedOn,
          reportedOnLabel: dateBlock?.arrivalDate || "",
          arrivals: toNumber(dataRow?.arrivals) || totalArrivals,
          totalArrivals,
          variety: dataRow?.variety || "",
          minimumPrice: toNumber(dataRow?.minimumPrice),
          maximumPrice: toNumber(dataRow?.maximumPrice),
          modalPrice: toNumber(dataRow?.modalPrice),
          unitOfArrivals: "Metric Tonnes",
          unitOfPrice: "Rs./Quintal"
        });
      });
    });
  });

  return rows.sort(
    (left, right) =>
      right.reportedOn.localeCompare(left.reportedOn) ||
      (right.modalPrice || 0) - (left.modalPrice || 0)
  );
}

function summarizeDateWiseRows(rows, options = {}) {
  if (!rows.length) {
    return null;
  }

  const latestDate = rows[0].reportedOn;
  const latestRows = rows.filter((row) => row.reportedOn === latestDate);
  const priceRows = latestRows.filter((row) => row.modalPrice !== null);
  const averageModalPrice =
    priceRows.length > 0
      ? Number(
          (
            priceRows.reduce((sum, row) => sum + row.modalPrice, 0) /
            priceRows.length
          ).toFixed(2)
        )
      : null;

  return {
    title: options.title || "",
    year: options.year,
    month: options.month,
    stateName: options.stateName || "",
    requestedDistrictName: options.requestedDistrictName || "",
    districtName: options.appliedDistrictName || "",
    districtFallbackApplied: Boolean(
      options.requestedDistrictName && !options.appliedDistrictName
    ),
    latestDate,
    averageModalPrice,
    marketsReporting: latestRows.length,
    totalArrivals: Number(
      latestRows.reduce((sum, row) => sum + (row.totalArrivals || row.arrivals || 0), 0).toFixed(2)
    ),
    minimumPrice:
      priceRows.length > 0
        ? Math.min(...priceRows.map((row) => row.minimumPrice ?? row.modalPrice))
        : null,
    maximumPrice:
      priceRows.length > 0
        ? Math.max(...priceRows.map((row) => row.maximumPrice ?? row.modalPrice))
        : null,
    unitOfPrice: "Rs./Quintal",
    unitOfArrivals: "Metric Tonnes",
    rows: latestRows.slice(0, 8).map((row) => ({
      marketName: row.marketName,
      districtName: row.districtName,
      variety: row.variety,
      arrivals: row.arrivals,
      minimumPrice: row.minimumPrice,
      maximumPrice: row.maximumPrice,
      modalPrice: row.modalPrice,
      reportedOn: row.reportedOn
    }))
  };
}

async function getAgmarknetCropPriceReport({
  cropKey,
  stateName,
  districtName,
  liveDate
}) {
  const [commodity, markets] = await Promise.all([
    resolveCommodityForCrop(cropKey),
    getMarketDirectory()
  ]);

  if (!commodity) {
    return null;
  }

  const locationInsight = await fetchCropInsight(cropKey, {
    stateName,
    districtName
  });
  const resolvedState =
    resolveStateRecord(markets, stateName) ||
    resolveStateRecord(markets, locationInsight?.stateName);

  if (!resolvedState) {
    return null;
  }

  const liveDateValue = liveDate || new Date().toISOString().slice(0, 10);
  const liveDateObject = new Date(`${liveDateValue}T00:00:00Z`);
  const currentYear = liveDateObject.getUTCFullYear();
  const currentMonth = liveDateObject.getUTCMonth() + 1;
  const normalizedDistrict = normalizeText(districtName);
  const [currentPayload, previousPayload] = await Promise.all([
    fetchDateWiseCommodityReport({
      year: currentYear,
      month: currentMonth,
      stateId: resolvedState.stateId,
      commodityId: commodity.id,
      liveDate: liveDateValue
    }),
    fetchDateWiseCommodityReport({
      year: currentYear - 1,
      month: currentMonth,
      stateId: resolvedState.stateId,
      commodityId: commodity.id,
      liveDate: liveDateValue
    })
  ]);

  const currentRows = flattenCommodityDateWiseReport(
    currentPayload,
    markets,
    resolvedState.stateName
  );
  const previousRows = flattenCommodityDateWiseReport(
    previousPayload,
    markets,
    resolvedState.stateName
  );
  const currentDistrictRows = normalizedDistrict
    ? currentRows.filter((row) => normalizeText(row.districtName) === normalizedDistrict)
    : currentRows;
  const previousDistrictRows = normalizedDistrict
    ? previousRows.filter((row) => normalizeText(row.districtName) === normalizedDistrict)
    : previousRows;

  return {
    cropKey,
    commodityId: commodity.id,
    commodityName: commodity.cmdt_name,
    stateId: resolvedState.stateId,
    stateName: resolvedState.stateName,
    requestedDistrictName: districtName || "",
    currentInsight: locationInsight,
    currentReport: summarizeDateWiseRows(
      currentDistrictRows.length > 0 ? currentDistrictRows : currentRows,
      {
        title: currentPayload?.title || "",
        year: currentYear,
        month: currentMonth,
        stateName: resolvedState.stateName,
        requestedDistrictName: districtName || "",
        appliedDistrictName: currentDistrictRows.length > 0 ? districtName || "" : ""
      }
    ),
    previousYearReport: summarizeDateWiseRows(
      previousDistrictRows.length > 0 ? previousDistrictRows : previousRows,
      {
        title: previousPayload?.title || "",
        year: currentYear - 1,
        month: currentMonth,
        stateName: resolvedState.stateName,
        requestedDistrictName: districtName || "",
        appliedDistrictName: previousDistrictRows.length > 0 ? districtName || "" : ""
      }
    ),
    source: "Agmarknet",
    sourceUrl: AGMARKNET_HOME_URL
  };
}

async function getAgmarknetCropInsights(cropKeys, options = {}) {
  const requestedKeys = Array.from(
    new Set((Array.isArray(cropKeys) ? cropKeys : []).filter(Boolean))
  );
  const entries = await Promise.all(
    requestedKeys.map(async (cropKey) => [cropKey, await fetchCropInsight(cropKey, options)])
  );

  return Object.fromEntries(entries.filter(([, value]) => value));
}

module.exports = {
  getAgmarknetCropInsights,
  getAgmarknetCropPriceReport,
  getAgmarknetLocations
};
