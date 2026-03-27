"use strict";

const VERIFIED_ON = "2026-03-27";
const IARI_SOURCE_NAME = "ICAR-IARI ZTM & BPD Unit";
const IARI_VARIETY_ROOT = "https://ztmbpd.iari.res.in/technologies/varietieshybrids/";
const PUSA_BEEJ_WHEAT_URL =
  "https://pusabeej.iari.res.in/varieties.php?crop_name=V2V5enlQSkV0anFPaTF6T3JkVTc5dz09";

function createUnsupportedCropResponse(cropKey) {
  return {
    cropKey,
    supported: false,
    verifiedOn: VERIFIED_ON,
    message:
      "An official variety sheet is not wired for this crop yet. The app only shows officially sourced values, so unsupported crops stay blank rather than using estimated seed numbers.",
    supportedCropKeys: Object.keys(SEED_VARIETY_LIBRARY)
  };
}

function buildCropEntry(cropKey, config) {
  const varieties = (config.varieties || []).map((item) => ({
    ...item,
    sourceName: item.sourceName || config.sourceName,
    sourceUrl: item.sourceUrl || config.sourceUrl,
    priceSourceUrl: item.priceSourceUrl || config.priceSourceUrl || null,
    officialPriceLabel: item.officialPriceLabel || null,
    officialPriceNote:
      item.officialPriceNote ||
      "The connected official source does not publish a retail seed price for this variety."
  }));

  return {
    cropKey,
    supported: true,
    cropLabel: config.cropLabel,
    sourceName: config.sourceName,
    sourceUrl: config.sourceUrl,
    priceSourceName: config.priceSourceName || null,
    priceSourceUrl: config.priceSourceUrl || null,
    verifiedOn: VERIFIED_ON,
    note:
      config.note ||
      "Only values explicitly published on the official source pages are shown here. If the source does not publish a retail price, the UI marks price as unavailable instead of estimating it.",
    varieties,
    varietyCount: varieties.length,
    officialPriceCount: varieties.filter((item) => item.officialPriceLabel).length
  };
}

const SEED_VARIETY_LIBRARY = {
  paddy: {
    cropLabel: "Paddy",
    sourceName: IARI_SOURCE_NAME,
    sourceUrl: `${IARI_VARIETY_ROOT}cereals/rice/`,
    varieties: [
      {
        name: "Pusa Basmati 1886",
        type: "Basmati variety",
        maturityLabel: "143 days",
        yieldLabel: "4.49 t/ha",
        suitabilityLabel: "Basmati GI regions of Haryana and Uttarakhand",
        insights: [
          "Bacterial blight resistant (xa13, Xa21)",
          "Blast resistant (Pi54, Pi2)",
          "Semi-dwarf, non-lodging, non-shattering"
        ]
      },
      {
        name: "Pusa Basmati 1885",
        type: "Basmati variety",
        maturityLabel: "140 days",
        yieldLabel: "4.68 t/ha",
        suitabilityLabel: "Basmati GI regions of Delhi, Punjab and Haryana",
        insights: [
          "Bacterial blight resistant (xa13, Xa21)",
          "Blast resistant (Pi54, Pi2)",
          "High-yielding basmati line with strong aroma"
        ]
      },
      {
        name: "Pusa Basmati 1847",
        type: "Short-duration basmati variety",
        maturityLabel: "120 days",
        yieldLabel: "5.7 t/ha",
        suitabilityLabel: "Basmati GI regions of Delhi, Punjab and Western Uttar Pradesh",
        insights: [
          "Short-duration line derived from Pusa Basmati 1509",
          "Bacterial blight and blast resistant",
          "Semi-dwarf, non-lodging and non-shattering"
        ]
      },
      {
        name: "Pusa Basmati 1728",
        type: "Basmati variety",
        maturityLabel: "140-145 days after sowing",
        yieldLabel: "20-24 q/acre",
        seedRateLabel: "5 kg/acre for transplanting",
        suitabilityLabel: "Punjab, Haryana, Delhi, Uttarakhand and Western Uttar Pradesh",
        insights: [
          "Resistant to bacterial blight",
          "Recommended for irrigated transplanted conditions",
          "Official spacing note: 20 cm x 20 cm at transplanting"
        ]
      },
      {
        name: "Pusa Basmati 1509",
        type: "Early basmati variety",
        maturityLabel: "115 days",
        yieldLabel: "5 t/ha",
        suitabilityLabel: "Punjab, Haryana, Delhi, Western Uttar Pradesh, Uttarakhand and Jammu & Kashmir",
        insights: [
          "Early variety that saves around 6 irrigations",
          "Non-lodging and non-shattering habit",
          "Designed to overcome major weaknesses of Pusa Basmati 1121"
        ]
      }
    ]
  },
  wheat: {
    cropLabel: "Wheat",
    sourceName: IARI_SOURCE_NAME,
    sourceUrl: `${IARI_VARIETY_ROOT}cereals/wheat/`,
    priceSourceName: "Pusa Beej Portal",
    priceSourceUrl: PUSA_BEEJ_WHEAT_URL,
    note:
      "Variety traits come from ICAR-IARI variety pages. Retail price is only shown where the official Pusa Beej seed portal lists it directly.",
    varieties: [
      {
        name: "HD 3226",
        type: "Bread wheat variety",
        maturityLabel: "142 days",
        yieldLabel: "57.5 q/ha average; 79.6 q/ha potential",
        suitabilityLabel: "Timely sown irrigated NWPZ",
        insights: [
          "Resistant to stripe, leaf and black rust",
          "Also resistant to Karnal bunt, powdery mildew, flag smut and foot rot",
          "High protein and strong chapati plus bread quality"
        ]
      },
      {
        name: "HD 3271",
        type: "Late to very-late sown wheat",
        maturityLabel: "122 days (NWPZ) / 98 days (NEPZ)",
        yieldLabel: "36.6 q/ha in NWPZ; 28.1 q/ha in NEPZ",
        suitabilityLabel: "Very late sown irrigated NWPZ and NEPZ",
        officialPriceLabel: "Rs 2,200 / 40 kg packet",
        officialPriceNote:
          "Official price shown from the ICAR-IARI Pusa Beej portal listing for HD-3271 wheat seed.",
        priceSourceUrl: PUSA_BEEJ_WHEAT_URL,
        insights: [
          "Resistant to leaf and stripe rust",
          "Bread-making type with wide adaptability from normal to very late sowing",
          "Useful where sowing is delayed but yield stability still matters"
        ]
      },
      {
        name: "HD 3298",
        type: "Biofortified wheat variety",
        maturityLabel: "104 days",
        yieldLabel: "39.0 q/ha average; 47.4 q/ha potential",
        suitabilityLabel: "Very late sown irrigated NWPZ",
        insights: [
          "High iron content and good protein level",
          "Resistant to stripe rust, leaf rust, Karnal bunt, powdery mildew and flag smut",
          "Heat-stress tolerant with good chapati quality"
        ]
      },
      {
        name: "HD 3249",
        type: "Biofortified wheat variety",
        maturityLabel: "122 days",
        yieldLabel: "57.5 q/ha average; 65.7 q/ha potential",
        suitabilityLabel: "Timely sown irrigated NEPZ",
        insights: [
          "Highly resistant to wheat blast, leaf rust and stripe rust",
          "Also resistant to Karnal bunt, leaf blight and powdery mildew",
          "Good bread and chapati-making quality"
        ]
      }
    ]
  },
  corn: {
    cropLabel: "Corn",
    sourceName: IARI_SOURCE_NAME,
    sourceUrl: `${IARI_VARIETY_ROOT}cereals/maize/`,
    varieties: [
      {
        name: "Pusa HM4 Improved",
        type: "Quality protein maize hybrid",
        maturityLabel: "Not published on official page",
        yieldLabel: "6,419 kg/ha",
        suitabilityLabel: "Northern Western Plain Zone",
        insights: [
          "Released in 2017",
          "0.91% tryptophan in endosperm protein",
          "3.62% lysine in endosperm protein"
        ]
      },
      {
        name: "Pusa HM8 Improved",
        type: "Quality protein maize hybrid",
        maturityLabel: "Not published on official page",
        yieldLabel: "6,258 kg/ha",
        suitabilityLabel: "Peninsular Zone",
        insights: [
          "Released in 2017",
          "1.06% tryptophan in endosperm protein",
          "4.18% lysine in endosperm protein"
        ]
      },
      {
        name: "Pusa Vivek Hybrid 27 Improved",
        type: "Biofortified maize hybrid",
        maturityLabel: "Not published on official page",
        yieldLabel: "4,854 kg/ha",
        suitabilityLabel: "North Eastern Plains Zone",
        insights: [
          "Released in 2020",
          "Biofortified for provitamin A",
          "Official page reports 5.49 ug/g provitamin A"
        ]
      },
      {
        name: "Pusa HQPM5 Improved",
        type: "National quality protein maize hybrid",
        maturityLabel: "Not published on official page",
        yieldLabel: "7,510 kg/ha in NWPZ; 7,263 kg/ha in NHZ",
        suitabilityLabel: "Across multiple maize zones in India",
        insights: [
          "Released in 2020",
          "6.77 ug/g provitamin A",
          "0.94% tryptophan and 4.25% lysine in endosperm protein"
        ]
      }
    ]
  },
  millet: {
    cropLabel: "Millet",
    sourceName: IARI_SOURCE_NAME,
    sourceUrl: `${IARI_VARIETY_ROOT}cereals/pearl-millet/`,
    note:
      "The official source page connected here is for pearl millet varieties, which is the closest direct match for the current millet crop option in the app.",
    varieties: [
      {
        name: "Pusa Composite 701",
        type: "Dual-purpose pearl millet variety",
        maturityLabel: "80 days",
        yieldLabel: "2.3 t/ha",
        suitabilityLabel: "Rajasthan, Gujarat, Haryana, Madhya Pradesh, Uttar Pradesh, Punjab and Delhi",
        insights: [
          "Highly resistant to downy mildew",
          "Blast resistant",
          "Dual-purpose grain and fodder line"
        ]
      },
      {
        name: "Pusa Composite 612",
        type: "Dual-purpose pearl millet variety",
        maturityLabel: "80-85 days",
        yieldLabel: "2.5 t/ha",
        suitabilityLabel: "Maharashtra, Tamil Nadu, Karnataka and Andhra Pradesh",
        insights: [
          "Suitable for normal and late sowing",
          "Downy mildew resistant",
          "Good option where sowing window shifts late"
        ]
      },
      {
        name: "Pusa 415",
        type: "Pearl millet variety",
        maturityLabel: "75-78 days",
        yieldLabel: "2.3 t/ha",
        suitabilityLabel: "North-western pearl millet belt",
        insights: [
          "Downy mildew resistant",
          "Tolerant to moisture stress",
          "Useful in shorter rainfall windows"
        ]
      },
      {
        name: "Pusa 23",
        type: "Pearl millet variety",
        maturityLabel: "82 days",
        yieldLabel: "2.3-2.8 t/ha",
        suitabilityLabel: "Rajasthan, Gujarat, Haryana, Madhya Pradesh, Uttar Pradesh, Punjab and Delhi",
        insights: [
          "Downy mildew resistant",
          "Suitable for broad north-western adaptation",
          "Balanced short-duration option"
        ]
      }
    ]
  },
  "green-gram": {
    cropLabel: "Green Gram",
    sourceName: IARI_SOURCE_NAME,
    sourceUrl: `${IARI_VARIETY_ROOT}pulses/mungbean/`,
    varieties: [
      {
        name: "Pusa Vishal",
        type: "Mungbean variety",
        maturityLabel: "60-65 days",
        yieldLabel: "12-14 q/ha",
        suitabilityLabel: "NWPZ for spring-summer",
        insights: [
          "Released in 2000",
          "Resistant to MYMV",
          "Early pulse option for short windows"
        ]
      },
      {
        name: "Pusa Ratna",
        type: "Mungbean variety",
        maturityLabel: "60-65 days",
        yieldLabel: "12-14 q/ha",
        suitabilityLabel: "NCR for kharif",
        insights: [
          "Released in 2004",
          "Resistant to MYMV",
          "Kharif-oriented official line"
        ]
      },
      {
        name: "Pusa 0672",
        type: "Mungbean variety",
        maturityLabel: "60-65 days",
        yieldLabel: "10-12 q/ha",
        suitabilityLabel: "NHZ for kharif",
        insights: [
          "Released in 2010",
          "Resistant to MYMV",
          "Useful for hill-zone kharif conditions"
        ]
      },
      {
        name: "Pusa 9531",
        type: "Mungbean variety",
        maturityLabel: "55-60 days",
        yieldLabel: "8-10 q/ha",
        suitabilityLabel: "Central Zone for summer",
        insights: [
          "Released in 2000",
          "Tolerant to MYMV",
          "Shortest-duration line in the connected official source set"
        ]
      }
    ]
  },
  soybean: {
    cropLabel: "Soybean",
    sourceName: IARI_SOURCE_NAME,
    sourceUrl: `${IARI_VARIETY_ROOT}oil-seeds/soyabean/`,
    varieties: [
      {
        name: "Pusa 12",
        type: "Soybean variety",
        maturityLabel: "120-135 days",
        yieldLabel: "22.86 q/ha average",
        suitabilityLabel: "Plain-zone soybean belt",
        insights: [
          "Released by CVRC in 2015",
          "Resistant to yellow mosaic virus, soybean mosaic virus and bacterial pustule",
          "Tolerant to lodging, shattering, charcoal rot and Myrothecium leaf spot"
        ]
      },
      {
        name: "Pusa 9712",
        type: "Soybean variety",
        maturityLabel: "110-120 days",
        yieldLabel: "20-25 q/ha",
        suitabilityLabel: "Plain-zone soybean belt",
        insights: [
          "Resistant to yellow mosaic virus, soybean mosaic virus and bacterial pustule",
          "Tolerant to lodging, shattering, charcoal rot, Myrothecium leaf spot and stem fly",
          "Good fit where shattering risk matters"
        ]
      }
    ]
  },
  mustard: {
    cropLabel: "Mustard",
    sourceName: IARI_SOURCE_NAME,
    sourceUrl: `${IARI_VARIETY_ROOT}oil-seeds/mustard/`,
    varieties: [
      {
        name: "Pusa Mustard 32",
        type: "Single-zero Indian mustard",
        maturityLabel: "142 days",
        yieldLabel: "27.10 q/ha",
        suitabilityLabel: "Punjab, Haryana, Delhi, Rajasthan, Western Uttar Pradesh, plains of J&K and Himachal Pradesh",
        insights: [
          "Low erucic acid variety",
          "38.0% oil content",
          "Suitable for timely sown irrigated conditions"
        ]
      },
      {
        name: "Pusa Double Zero Mustard 33",
        type: "Double-zero mustard",
        maturityLabel: "141 days",
        yieldLabel: "26.44 q/ha",
        suitabilityLabel: "Zone II timely sown irrigated conditions",
        insights: [
          "Erucic acid below 2%",
          "Glucosinolate below 30 ppm",
          "38.0% oil content"
        ]
      },
      {
        name: "Pusa Double Zero Mustard 31",
        type: "Canola-quality mustard",
        maturityLabel: "144 days",
        yieldLabel: "2,379 kg/ha",
        suitabilityLabel: "Delhi NCR and adjoining Haryana, Rajasthan and Uttar Pradesh",
        insights: [
          "First double-zero Indian mustard variety in the country",
          "40.56% oil content",
          "Yellow-seeded canola-quality line"
        ]
      },
      {
        name: "Pusa Mustard 30",
        type: "Single-zero Indian mustard",
        maturityLabel: "137 days",
        yieldLabel: "18.24 q/ha",
        suitabilityLabel: "Uttar Pradesh, Uttarakhand, Madhya Pradesh and eastern Rajasthan",
        insights: [
          "Low erucic acid variety",
          "37.7% oil content",
          "Bold-seeded line"
        ]
      },
      {
        name: "Jagannath (VSL-5)",
        type: "Bold-seeded mustard",
        maturityLabel: "125 days",
        yieldLabel: "25.0 q/ha",
        suitabilityLabel: "Uttar Pradesh, Madhya Pradesh, Chhattisgarh and Rajasthan",
        insights: [
          "Suitable for timely as well as late sown irrigated conditions",
          "40.0% oil content",
          "Bold-seeded type"
        ]
      },
      {
        name: "Pusa Tarak",
        type: "Short-duration mustard",
        maturityLabel: "121 days",
        yieldLabel: "19.24 q/ha",
        suitabilityLabel: "Multiple-cropping windows between September and December",
        insights: [
          "Fits after vegetables or sugarcane before January planting",
          "Bold-seeded type",
          "Around 40% oil content"
        ]
      },
      {
        name: "Pusa Mustard 28",
        type: "Short-duration catch-crop mustard",
        maturityLabel: "107 days",
        yieldLabel: "19.93 q/ha",
        suitabilityLabel: "North-western mustard belt as a catch crop between kharif and rabi",
        insights: [
          "41.5% oil content",
          "Tolerates high temperature at seedling stage",
          "Useful in tight multiple-cropping systems"
        ]
      },
      {
        name: "Pusa Agrani",
        type: "Early Indian mustard",
        maturityLabel: "110 days",
        yieldLabel: "17.5 q/ha",
        suitabilityLabel: "North Eastern and Eastern states after rice",
        insights: [
          "First early maturing Indian mustard line from the source page",
          "39-40% oil content",
          "Suitable for both early and late sowing"
        ]
      }
    ]
  },
  tomato: {
    cropLabel: "Tomato",
    sourceName: IARI_SOURCE_NAME,
    sourceUrl: `${IARI_VARIETY_ROOT}vegetables/tomato/`,
    varieties: [
      {
        name: "Pusa Prasanskrit",
        type: "Protected-cultivation tomato",
        maturityLabel: "Not published on official page",
        yieldLabel: "75-80 t/ha",
        suitabilityLabel: "Low-cost net-house and protected cultivation",
        insights: [
          "ToLCD resistant",
          "Average fruit weight 90-95 g",
          "High lycopene and high TSS processing profile"
        ]
      },
      {
        name: "Pusa Hybrid-2",
        type: "Field tomato hybrid",
        maturityLabel: "Available from March end to May end",
        yieldLabel: "55 t/ha",
        suitabilityLabel: "Long-distance transport markets",
        insights: [
          "Determinate plants with round medium fruits",
          "Field resistant to nematodes",
          "Useful where transportability matters"
        ]
      },
      {
        name: "Pusa Hybrid-4",
        type: "Field tomato hybrid",
        maturityLabel: "Sowing from mid-October to mid-December",
        yieldLabel: "55 t/ha",
        suitabilityLabel: "North Indian plains",
        insights: [
          "Uniform ripening fruits",
          "Good for long-distance transportation",
          "Determinate plant type"
        ]
      },
      {
        name: "Pusa Gaurav",
        type: "Processing tomato variety",
        maturityLabel: "Spring-summer and kharif",
        yieldLabel: "40.0 t/ha",
        suitabilityLabel: "Processing and transport use",
        insights: [
          "High TSS and thick skin",
          "Uniformly red egg-shaped fruits",
          "Suitable for long-distance transportation and processing"
        ]
      },
      {
        name: "Pusa Ruby",
        type: "Early tomato variety",
        maturityLabel: "60-65 days after transplanting",
        yieldLabel: "30.0 t/ha",
        suitabilityLabel: "Autumn-winter and spring-summer in northern plains",
        insights: [
          "Good for juice and ketchup",
          "Uniform red fruits with slightly acidic taste",
          "Early indeterminate type"
        ]
      }
    ]
  },
  onion: {
    cropLabel: "Onion",
    sourceName: IARI_SOURCE_NAME,
    sourceUrl: `${IARI_VARIETY_ROOT}vegetables/onion/`,
    varieties: [
      {
        name: "Pusa Riddhi",
        type: "Red onion variety",
        maturityLabel: "Not published on official page",
        yieldLabel: "32.0 t/ha",
        suitabilityLabel: "Delhi and NCR",
        insights: [
          "Dark red flat-globe bulbs",
          "Suitable for storage and export",
          "Rich in antioxidant quercetin"
        ]
      },
      {
        name: "Pusa Madhvi",
        type: "Storage onion variety",
        maturityLabel: "130-135 days after transplanting",
        yieldLabel: "35.0 t/ha",
        suitabilityLabel: "General onion belt",
        insights: [
          "Good keeping quality",
          "TSS 11-13%",
          "Medium to large light-red bulbs"
        ]
      },
      {
        name: "Pusa Red",
        type: "Traditional red onion variety",
        maturityLabel: "135-140 days after transplanting",
        yieldLabel: "30.0 t/ha",
        suitabilityLabel: "General onion belt",
        insights: [
          "Good keeping quality",
          "TSS 12-13%",
          "Less pungent than the sharper storage line"
        ]
      }
    ]
  },
  brinjal: {
    cropLabel: "Brinjal",
    sourceName: IARI_SOURCE_NAME,
    sourceUrl: `${IARI_VARIETY_ROOT}vegetables/brinjal/`,
    varieties: [
      {
        name: "Pusa Kaushal",
        type: "Long-fruited brinjal variety",
        maturityLabel: "55 days from transplanting",
        yieldLabel: "38.2 t/ha",
        suitabilityLabel: "General brinjal cultivation",
        insights: [
          "Non-spiny erect plants",
          "80-90 g violet-purple fruits",
          "Good early harvest option"
        ]
      },
      {
        name: "Pusa Hybrid-20",
        type: "Long-fruited brinjal hybrid",
        maturityLabel: "55 days to first harvest",
        yieldLabel: "52.5 t/ha",
        suitabilityLabel: "Zone IV: Punjab, Delhi, Uttar Pradesh and Bihar",
        insights: [
          "Long dark-purple glossy fruits",
          "Semi-erect non-spiny plants",
          "Higher-yield hybrid option"
        ]
      },
      {
        name: "Pusa Ankur",
        type: "Small-fruited brinjal variety",
        maturityLabel: "45-50 days after transplanting",
        yieldLabel: "35.0 t/ha",
        suitabilityLabel: "General brinjal cultivation",
        insights: [
          "Small glossy dark-purple fruits",
          "Early first picking",
          "Compact fruit profile"
        ]
      },
      {
        name: "Pusa Hybrid-5",
        type: "Long-fruited brinjal hybrid",
        maturityLabel: "50-55 days after transplanting",
        yieldLabel: "55.0 t/ha",
        suitabilityLabel: "General brinjal cultivation",
        insights: [
          "Upright spineless plants",
          "Long medium-sized dark-purple fruits",
          "Highest-yield brinjal option in the connected source set"
        ]
      }
    ]
  },
  cabbage: {
    cropLabel: "Cabbage",
    sourceName: IARI_SOURCE_NAME,
    sourceUrl: `${IARI_VARIETY_ROOT}vegetables/cabbage/`,
    varieties: [
      {
        name: "Pusa Hybrid 1",
        type: "Cabbage hybrid",
        maturityLabel: "60 days",
        yieldLabel: "42-45 t/ha",
        suitabilityLabel: "General cabbage cultivation",
        insights: [
          "Round compact green heads",
          "Better field staying capacity after maturity",
          "Early heading hybrid"
        ]
      },
      {
        name: "Pusa Hybrid 81",
        type: "Cabbage hybrid",
        maturityLabel: "60-65 days after transplanting",
        yieldLabel: "43.5 t/ha",
        suitabilityLabel: "General cabbage cultivation",
        insights: [
          "Field tolerant to black rot disease",
          "Good field staying capacity after head formation",
          "Very compact heads"
        ]
      }
    ]
  },
  cauliflower: {
    cropLabel: "Cauliflower",
    sourceName: IARI_SOURCE_NAME,
    sourceUrl: `${IARI_VARIETY_ROOT}vegetables/cauliflower/`,
    varieties: [
      {
        name: "Pusa Ashwini",
        type: "Early cauliflower variety",
        maturityLabel: "Marketable in first fortnight of October",
        yieldLabel: "16.0-18.0 t/ha",
        suitabilityLabel: "July transplanting under 22-27 C conditions",
        insights: [
          "Compact white curds",
          "Average curd weight 500-600 g",
          "Early maturity group"
        ]
      },
      {
        name: "Pusa Kartiki",
        type: "Early cauliflower variety",
        maturityLabel: "Ready in second fortnight of October",
        yieldLabel: "18.0 t/ha",
        suitabilityLabel: "Early-sown North Indian plains",
        insights: [
          "Suitable for sowing from beginning of June",
          "Compact retentive white curds",
          "500-600 g net curd weight"
        ]
      },
      {
        name: "Pusa Meghna",
        type: "Extra-early cauliflower variety",
        maturityLabel: "Ready in early October",
        yieldLabel: "12.5 t/ha",
        suitabilityLabel: "North Indian plains October group",
        insights: [
          "Extra early type",
          "Compact white curds weighing 350-400 g",
          "Useful where earliest market entry matters"
        ]
      }
    ]
  },
  carrot: {
    cropLabel: "Carrot",
    sourceName: IARI_SOURCE_NAME,
    sourceUrl: `${IARI_VARIETY_ROOT}vegetables/carrot/`,
    varieties: [
      {
        name: "Pusa Rudhira",
        type: "Tropical carrot variety",
        maturityLabel: "Harvest in middle of December",
        yieldLabel: "30.0 t/ha",
        suitabilityLabel: "Mid-September to October sowing",
        insights: [
          "Long red roots with self-coloured core",
          "Tropical type for red carrot markets",
          "Good fit for autumn sowing"
        ]
      },
      {
        name: "Pusa Asita",
        type: "Black carrot variety",
        maturityLabel: "90-110 days",
        yieldLabel: "25.0 t/ha",
        suitabilityLabel: "September to October sowing",
        insights: [
          "Long black roots with self-coloured core",
          "Tropical black carrot type",
          "Winter harvest window"
        ]
      },
      {
        name: "Pusa Vasuda",
        type: "Public-sector tropical carrot hybrid",
        maturityLabel: "80-90 days",
        yieldLabel: "40.0 t/ha",
        suitabilityLabel: "General tropical carrot production",
        insights: [
          "Smooth attractive red roots",
          "Rich in carotenoids, lycopene, TSS and minerals",
          "Suitable for salad, juice, cooking and carotenoid extraction"
        ]
      }
    ]
  },
  cucumber: {
    cropLabel: "Cucumber",
    sourceName: IARI_SOURCE_NAME,
    sourceUrl: `${IARI_VARIETY_ROOT}vegetables/cucumber/`,
    varieties: [
      {
        name: "Pusa Barkha",
        type: "Kharif cucumber variety",
        maturityLabel: "40-45 days after sowing",
        yieldLabel: "18.8 t/ha",
        suitabilityLabel: "North Indian plains during kharif",
        insights: [
          "Extra-early official cucumber line",
          "Field tolerant to high humidity and high temperature",
          "Downy mildew tolerance noted on source page"
        ]
      }
    ]
  },
  peas: {
    cropLabel: "Peas",
    sourceName: IARI_SOURCE_NAME,
    sourceUrl: `${IARI_VARIETY_ROOT}vegetables/garden-pea/`,
    note:
      "The official source page connected here is for garden pea, which is the closest direct match for the current peas crop option in the app.",
    varieties: [
      {
        name: "Pusa Shree",
        type: "Garden pea variety",
        maturityLabel: "50-55 days after sowing",
        yieldLabel: "4.5-5.0 t/ha in early sowing; 9.0-10.0 t/ha in normal sowing",
        suitabilityLabel: "Jammu & Kashmir, Himachal Pradesh and Uttarakhand",
        insights: [
          "Fusarium wilt resistant",
          "Tolerant to high temperature during early sowing",
          "Dark green pods with 6-7 seeds per pod"
        ]
      }
    ]
  },
  "bottle-gourd": {
    cropLabel: "Bottle Gourd",
    sourceName: IARI_SOURCE_NAME,
    sourceUrl: `${IARI_VARIETY_ROOT}vegetables/bottle-gourd/`,
    varieties: [
      {
        name: "Pusa Santushti",
        type: "Bottle gourd variety",
        maturityLabel: "55-60 days",
        yieldLabel: "28.8 t/ha in kharif; 26.1 t/ha in summer",
        suitabilityLabel: "Low-temperature and high-temperature fruit set windows",
        insights: [
          "Sets fruit at 10-12 C as well as 35-40 C",
          "Pear-shaped green fruits weighing 0.8-1.0 kg",
          "Nutritionally rich line with vitamin C and mineral detail on official page"
        ]
      }
    ]
  }
};

function getOfficialSeedVarieties(cropKey) {
  const normalizedCropKey = String(cropKey || "").trim().toLowerCase();

  if (!normalizedCropKey) {
    return createUnsupportedCropResponse("");
  }

  const cropConfig = SEED_VARIETY_LIBRARY[normalizedCropKey];

  if (!cropConfig) {
    return createUnsupportedCropResponse(normalizedCropKey);
  }

  return buildCropEntry(normalizedCropKey, cropConfig);
}

module.exports = {
  getOfficialSeedVarieties
};
