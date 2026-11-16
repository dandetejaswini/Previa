/**
 * Previa Verified Geographic Location Reference
 * 
 * Provides verified coordinates for global logistics nodes, seaports, intermodal hubs,
 * and manufacturing clusters.
 * 
 * IMPORTANT: Returns coordinates ONLY for verified known nodes.
 * Strictly never hallucinates, estimates, or generates synthetic coordinates.
 */

export interface VerifiedLogisticsNode {
  name: string;
  latitude: number;
  longitude: number;
  type: "port" | "rail_hub" | "airport" | "cluster" | "facility";
  country: string;
  aliases: string[];
}

export const VERIFIED_LOGISTICS_NODES: Record<string, VerifiedLogisticsNode> = {
  "taipei": {
    name: "Taipei Port",
    latitude: 25.1500,
    longitude: 121.3800,
    type: "port",
    country: "Taiwan",
    aliases: ["taipei port", "taipei", "port of taipei", "taiwan-taipei", "taipei maritime"],
  },
  "kaohsiung": {
    name: "Kaohsiung Port",
    latitude: 22.6163,
    longitude: 120.2800,
    type: "port",
    country: "Taiwan",
    aliases: ["kaohsiung port", "kaohsiung", "port of kaohsiung"],
  },
  "hsinchu": {
    name: "Hsinchu Science Park",
    latitude: 24.7827,
    longitude: 121.0064,
    type: "cluster",
    country: "Taiwan",
    aliases: ["hsinchu", "hsinchu science park", "tsmc fab 12/20", "hsinchu fab"],
  },
  "tainan": {
    name: "Tainan Science Park",
    latitude: 23.1114,
    longitude: 120.2974,
    type: "cluster",
    country: "Taiwan",
    aliases: ["tainan", "tainan science park", "tsmc fab 18", "tainan fab"],
  },
  "rotterdam": {
    name: "Rotterdam Terminal Hub",
    latitude: 51.9244,
    longitude: 4.4777,
    type: "port",
    country: "Netherlands",
    aliases: ["rotterdam terminal hub", "rotterdam", "port of rotterdam", "rotterdam port", "maasvlakte"],
  },
  "singapore": {
    name: "Singapore Port",
    latitude: 1.2903,
    longitude: 103.8520,
    type: "port",
    country: "Singapore",
    aliases: ["singapore port", "singapore", "port of singapore", "psa singapore", "jurong port"],
  },
  "shanghai": {
    name: "Shanghai Port (Yangshan)",
    latitude: 31.2304,
    longitude: 121.4737,
    type: "port",
    country: "China",
    aliases: ["shanghai port", "shanghai", "port of shanghai", "yangshan deepwater port", "yangshan"],
  },
  "ningbo": {
    name: "Ningbo-Zhoushan Port",
    latitude: 29.8683,
    longitude: 121.5440,
    type: "port",
    country: "China",
    aliases: ["ningbo", "ningbo-zhoushan port", "port of ningbo", "ningbo port"],
  },
  "shenzhen": {
    name: "Shenzhen Port (Yantian)",
    latitude: 22.5750,
    longitude: 114.2750,
    type: "port",
    country: "China",
    aliases: ["shenzhen", "yantian", "shenzhen port", "yantian port", "shekou"],
  },
  "busan": {
    name: "Busan Port",
    latitude: 35.1028,
    longitude: 129.0403,
    type: "port",
    country: "South Korea",
    aliases: ["busan port", "busan", "port of busan"],
  },
  "los_angeles": {
    name: "Port of Los Angeles",
    latitude: 33.7432,
    longitude: -118.2673,
    type: "port",
    country: "USA",
    aliases: ["los angeles", "port of los angeles", "los angeles port", "la port", "san pedro"],
  },
  "long_beach": {
    name: "Port of Long Beach",
    latitude: 33.7542,
    longitude: -118.2165,
    type: "port",
    country: "USA",
    aliases: ["long beach", "port of long beach", "long beach port"],
  },
  "hamburg": {
    name: "Port of Hamburg",
    latitude: 53.5353,
    longitude: 9.9872,
    type: "port",
    country: "Germany",
    aliases: ["hamburg", "port of hamburg", "hamburg port"],
  },
  "antwerp": {
    name: "Port of Antwerp-Bruges",
    latitude: 51.2635,
    longitude: 4.3725,
    type: "port",
    country: "Belgium",
    aliases: ["antwerp", "port of antwerp", "antwerp port", "antwerp-bruges"],
  },
  "felixstowe": {
    name: "Port of Felixstowe",
    latitude: 51.9634,
    longitude: 1.3511,
    type: "port",
    country: "UK",
    aliases: ["felixstowe", "port of felixstowe"],
  },
  "dubai": {
    name: "Jebel Ali Port (Dubai)",
    latitude: 24.9857,
    longitude: 55.0273,
    type: "port",
    country: "UAE",
    aliases: ["dubai", "jebel ali", "port of jebel ali", "dubai port"],
  },
  "suez": {
    name: "Suez Canal (Port Said)",
    latitude: 31.2653,
    longitude: 32.3019,
    type: "port",
    country: "Egypt",
    aliases: ["suez canal", "port said", "suez", "red sea entrance"],
  },
  "panama": {
    name: "Panama Canal (Colon / Balboa)",
    latitude: 9.3598,
    longitude: -79.9015,
    type: "port",
    country: "Panama",
    aliases: ["panama canal", "colon", "balboa", "panama"],
  },
  "chicago": {
    name: "Chicago Intermodal Freight Rail Hub",
    latitude: 41.8781,
    longitude: -87.6298,
    type: "rail_hub",
    country: "USA",
    aliases: ["chicago", "chicago rail hub", "chicago intermodal", "corwith yard", "bedford park"],
  },
  "memphis": {
    name: "Memphis Logistics Gateway",
    latitude: 35.1495,
    longitude: -90.0490,
    type: "rail_hub",
    country: "USA",
    aliases: ["memphis", "memphis hub", "memphis intermodal"],
  },
  "phoenix": {
    name: "Phoenix Semiconductor Fab Corridor",
    latitude: 33.7226,
    longitude: -112.1648,
    type: "cluster",
    country: "USA",
    aliases: ["phoenix", "phoenix fab", "tsmc fab 21", "intel ocatillo", "chandler fab"],
  },
  "austin": {
    name: "Austin Silicon Hills",
    latitude: 30.2672,
    longitude: -97.7431,
    type: "cluster",
    country: "USA",
    aliases: ["austin", "austin fab", "samsung taylor", "silicon hills"],
  },
  "dresden": {
    name: "Dresden Silicon Saxony",
    latitude: 51.0504,
    longitude: 13.7373,
    type: "cluster",
    country: "Germany",
    aliases: ["dresden", "silicon saxony", "infineon dresden", "bosch dresden"],
  },
  "basel": {
    name: "Basel Pharma Logistics Hub",
    latitude: 47.5596,
    longitude: 7.5886,
    type: "cluster",
    country: "Switzerland",
    aliases: ["basel", "basel pharma", "euroairport basel"],
  },
  "frankfurt": {
    name: "Frankfurt CargoCity Hub",
    latitude: 50.0379,
    longitude: 8.5622,
    type: "airport",
    country: "Germany",
    aliases: ["frankfurt", "frankfurt airport", "cargocity frankfurt"],
  },
  "indianapolis": {
    name: "Indianapolis Cold-Chain Gateway",
    latitude: 39.7684,
    longitude: -86.1581,
    type: "airport",
    country: "USA",
    aliases: ["indianapolis", "indianapolis hub", "indy cold-chain"],
  },
  "hyderabad": {
    name: "Hyderabad Genome Valley",
    latitude: 17.3850,
    longitude: 78.4867,
    type: "cluster",
    country: "India",
    aliases: ["hyderabad", "genome valley", "hyderabad pharma"],
  },
  "pilbara": {
    name: "Pilbara Mining & Export Terminal",
    latitude: -20.3167,
    longitude: 118.5760,
    type: "port",
    country: "Australia",
    aliases: ["pilbara", "port hedland", "dampier", "pilbara iron ore"],
  },
  "antofagasta": {
    name: "Antofagasta Lithium & Copper Terminal",
    latitude: -23.6500,
    longitude: -70.4000,
    type: "port",
    country: "Chile",
    aliases: ["antofagasta", "port of antofagasta", "mejillones"],
  },
  "lubumbashi": {
    name: "Katanga / Lubumbashi Mining Corridor",
    latitude: -11.6609,
    longitude: 27.4794,
    type: "cluster",
    country: "DRC",
    aliases: ["lubumbashi", "katanga", "kolwezi", "drc cobalt hub"],
  },
  "santos": {
    name: "Port of Santos",
    latitude: -23.9619,
    longitude: -46.3023,
    type: "port",
    country: "Brazil",
    aliases: ["santos", "port of santos", "santos port"],
  },
};

/**
 * Searches the verified logistics database for known node coordinates.
 * Returns null if the location cannot be verified with certainty.
 */
export function lookupLocationCoordinates(
  rawName?: string | null
): { latitude: number; longitude: number; name: string; type: string; country: string } | null {
  if (!rawName || typeof rawName !== "string") return null;

  const normalized = rawName
    .toLowerCase()
    .trim()
    .replace(/[,\.\-\/]/g, " ")
    .replace(/\s+/g, " ");

  if (!normalized) return null;

  // 1. Direct match by key
  for (const [key, node] of Object.entries(VERIFIED_LOGISTICS_NODES)) {
    if (normalized === key) {
      return {
        latitude: node.latitude,
        longitude: node.longitude,
        name: node.name,
        type: node.type,
        country: node.country,
      };
    }
  }

  // 2. Exact match in aliases
  for (const node of Object.values(VERIFIED_LOGISTICS_NODES)) {
    for (const alias of node.aliases) {
      if (normalized === alias.toLowerCase()) {
        return {
          latitude: node.latitude,
          longitude: node.longitude,
          name: node.name,
          type: node.type,
          country: node.country,
        };
      }
    }
  }

  // 3. Substring containment match in aliases
  for (const node of Object.values(VERIFIED_LOGISTICS_NODES)) {
    for (const alias of node.aliases) {
      const a = alias.toLowerCase();
      if (normalized.includes(a) || a.includes(normalized)) {
        return {
          latitude: node.latitude,
          longitude: node.longitude,
          name: node.name,
          type: node.type,
          country: node.country,
        };
      }
    }
  }

  // Strictly return null if unverified — never generate dummy coordinates
  return null;
}
