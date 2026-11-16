import {
  DisruptionRun,
  DeliveryDriftRun,
  IndustrySectorId,
  TelemetryTag,
} from "../types";

export interface CommonScenarioOption {
  id: string;
  name: string;
  title: string;
  narrative: string;
  urgency: string;
  severity: string;
  sectorParameters?: Record<string, string>;
}

export interface SectorConfig {
  id: IndustrySectorId;
  name: string;
  iconName: string;
  fields: Array<{
    key: string;
    label: string;
    placeholder: string;
    defaultValue?: string;
    fullWidth?: boolean;
  }>;
  commonScenarios: CommonScenarioOption[];
}

export const INDUSTRY_SECTORS: SectorConfig[] = [
  {
    id: "semiconductor",
    name: "Semiconductor",
    iconName: "Cpu",
    fields: [
      {
        key: "fabricator",
        label: "Fabricator / Location",
        placeholder: "e.g. Hsinchu Science Park, Fab 14A, Taiwan",
      },
      {
        key: "component",
        label: "Component / Die Architecture",
        placeholder: "e.g. 32-bit ASIL-D Automotive Body Control Microcontroller",
      },
      {
        key: "packaging",
        label: "Packaging / Substrate Facility",
        placeholder: "e.g. Tainan Advanced Packaging Center (ASE)",
      },
      {
        key: "yieldDeficit",
        label: "Yield / Quota Deficit",
        placeholder: "e.g. 40% wafer quota cut; 18 weeks lead-time extension",
      },
      {
        key: "starvationRisk",
        label: "Downstream Assembly Starvation Risk",
        placeholder: "e.g. Vehicle electronics assembly lines face starvation within 11 days upon buffer depletion",
        fullWidth: true,
      },
    ],
    commonScenarios: [
      {
        id: "semi_wafer_yield",
        name: "Wafer Yield Deficit",
        title: "Tier-1 28nm Wafer Foundry Defect & Yield Loss",
        narrative: "Critical photomask misalignment during 28nm automotive MCU processing resulted in a 42% lot yield deficit at primary Hsinchu fab. Lead times extended from 14 weeks to 26 weeks, creating downstream buffer depletion risks for vehicle assembly plants within 14 days.",
        urgency: "Immediate (0–7 Days)",
        severity: "Critical (P1)",
        sectorParameters: {
          fabricator: "Hsinchu Science Park, Fab 14A, Taiwan",
          component: "32-bit ASIL-D Automotive Body Control Microcontroller",
          packaging: "Tainan Advanced Packaging Center (ASE)",
          yieldDeficit: "42% wafer yield deficit; 12-week lead time extension",
          starvationRisk: "ECU assembly lines face assembly halt in 14 days",
        },
      },
      {
        id: "semi_packaging_bottleneck",
        name: "Advanced Packaging Bottleneck",
        title: "FC-BGA Substrate & Advanced Packaging Shortage",
        narrative: "Severe packaging substrate capacity constraints at Tainan OSAT facility. Backlog has expanded substrate queuing times by 35 days, impacting high-density server power-stage controller deliveries.",
        urgency: "Near-Term (1–3 Weeks)",
        severity: "High (P2)",
      },
      {
        id: "semi_foundry_power",
        name: "Foundry Power Outage",
        title: "Regional Grid Voltage Sag Halts Semiconductor Lithography",
        narrative: "Unplanned regional power transmission glitch forced emergency shutdown of EUV/DUV lithography cleanrooms. 3 weeks of WIP wafers quarantined for thermal and particulate inspection.",
        urgency: "Immediate (0–7 Days)",
        severity: "Critical (P1)",
      },
      {
        id: "semi_export_license",
        name: "Export License Restriction",
        title: "Trade Regulatory Entity Restriction on High-Performance Dies",
        narrative: "New regulatory export classification requires re-filing of end-use declarations for AI accelerator silicon, freezing bonded warehouse shipments pending export authority sign-off.",
        urgency: "Medium-Term (1–2 Months)",
        severity: "Medium (P3)",
      },
    ],
  },
  {
    id: "maritime",
    name: "Maritime & Shipping",
    iconName: "Ship",
    fields: [
      {
        key: "originPort",
        label: "Origin Port",
        placeholder: "e.g. Port of Ningbo-Zhoushan (CNNGB)",
      },
      {
        key: "destinationPort",
        label: "Destination Port",
        placeholder: "e.g. Port of Rotterdam (NLRTM)",
      },
      {
        key: "vesselRoute",
        label: "Vessel / Route",
        placeholder: "e.g. Cape of Good Hope Bypass, FE-2 Loop",
      },
      {
        key: "portCongestion",
        label: "Port Congestion Index",
        placeholder: "e.g. 6.4 days average waiting at berth",
      },
      {
        key: "estimatedDelay",
        label: "Estimated Delay & Route Variance",
        placeholder: "e.g. +14 to 18 transit days schedule extension",
        fullWidth: true,
      },
    ],
    commonScenarios: [
      {
        id: "maritime_port_congestion",
        name: "Port Congestion",
        title: "Terminal Berthing Dwell Surge at Major Transshipment Hub",
        narrative: "Severe yard density (94% utilization) and gantry crane maintenance backlog at Port of Rotterdam have increased container vessel wait times to 7.8 days at anchorage.",
        urgency: "Near-Term (1–3 Weeks)",
        severity: "High (P2)",
        sectorParameters: {
          originPort: "Port of Shanghai (CNSHA)",
          destinationPort: "Port of Rotterdam (NLRTM)",
          vesselRoute: "Asia-Europe Northern Loop",
          portCongestion: "7.8 days average anchorage wait",
          estimatedDelay: "+9 to 12 transit days",
        },
      },
      {
        id: "maritime_port_strike",
        name: "Port Strike",
        title: "Terminal Longshore Labor Work Stoppage at Marine Terminal",
        narrative: "Dockworker union contract negotiations reached impasse, resulting in 48-hour rolling strike actions. Inbound container discharge suspended across all container berths.",
        urgency: "Immediate (0–7 Days)",
        severity: "Critical (P1)",
      },
      {
        id: "maritime_vessel_delay",
        name: "Vessel Delay",
        title: "Ultra-Large Container Vessel Engine Mechanical Failure",
        narrative: "Main propulsion turbine sensor failure forced vessel to reduce speed to 4.2 knots in open sea corridor. ETA slipped by 11 days pending emergency drydock clearance.",
        urgency: "Immediate (0–7 Days)",
        severity: "High (P2)",
      },
      {
        id: "maritime_canal_disruption",
        name: "Canal Disruption",
        title: "Maritime Bottleneck & Canal Transit Capacity Reduction",
        narrative: "Severe drought draft restrictions and geopolitical advisory prompted 100% rerouting of containerships around Cape of Good Hope, adding 14–18 sailing days.",
        urgency: "Near-Term (1–3 Weeks)",
        severity: "Critical (P1)",
      },
      {
        id: "maritime_container_shortage",
        name: "Container Shortage",
        title: "40ft High-Cube Empty Container Deficit at Export Gateways",
        narrative: "Severe equipment imbalance across Asian export origins. Empty container positioning lead-times lengthened by 18 days, holding finished goods at supplier docks.",
        urgency: "Near-Term (1–3 Weeks)",
        severity: "Medium (P3)",
      },
      {
        id: "maritime_lane_disruption",
        name: "Shipping Lane Disruption",
        title: "Severe Monsoon Storm Forcing Sea Corridor Rerouting",
        narrative: "Category 4 typhoon in South China Sea forced commercial fleet diversions, stalling scheduled feeders and delaying transshipment connection windows.",
        urgency: "Immediate (0–7 Days)",
        severity: "High (P2)",
      },
      {
        id: "maritime_carrier_capacity",
        name: "Carrier Capacity Reduction",
        title: "Carrier Alliance Blank Sailings & Route Consolidation",
        narrative: "Ocean carriers instituted 4 consecutive blank sailings to manage rate integrity, cutting available container slot allocation on North America Pacific lane by 26%.",
        urgency: "Near-Term (1–3 Weeks)",
        severity: "Medium (P3)",
      },
    ],
  },
  {
    id: "minerals",
    name: "Critical Minerals",
    iconName: "Gem",
    fields: [
      {
        key: "mineRefinery",
        label: "Mine / Refinery Facility",
        placeholder: "e.g. Greenbushes Spodumene / Kwinana Hydroxide Plant",
      },
      {
        key: "material",
        label: "Material Specification",
        placeholder: "e.g. Battery-grade Lithium Carbonate & Cobalt Cathode",
      },
      {
        key: "supplierCountry",
        label: "Supplier Country & Export Terminal",
        placeholder: "e.g. Western Australia / Port Hedland",
      },
      {
        key: "allocationDeficit",
        label: "Allocation Deficit / Spot Markup",
        placeholder: "e.g. 28% monthly quota cut; +35% spot premium",
      },
      {
        key: "alternativeSource",
        label: "Alternative Source Availability",
        placeholder: "e.g. South American brine alternative constrained by 90-day qualification lock",
        fullWidth: true,
      },
    ],
    commonScenarios: [
      {
        id: "minerals_smelter_shutdown",
        name: "Smelter Shutdown",
        title: "Primary Smelter Furnace Unplanned Maintenance Outage",
        narrative: "Refractory lining breach forced indefinite shutdown of high-purity nickel smelting furnace. Monthly refined output reduced by 45,000 MT.",
        urgency: "Near-Term (1–3 Weeks)",
        severity: "High (P2)",
      },
      {
        id: "minerals_quota_restriction",
        name: "Export Quota Restriction",
        title: "Raw Mineral National Export Tariff & Quota Cap",
        narrative: "Government ministry imposed unexpected 30% export quota reduction on battery-grade lithium hydroxide to prioritize domestic processing capacity.",
        urgency: "Medium-Term (1–2 Months)",
        severity: "Critical (P1)",
      },
      {
        id: "minerals_mine_strike",
        name: "Mine Strike / Labor Action",
        title: "Open-Pit Mine Excavation & Hauler Strike",
        narrative: "Indefinite labor strike shut down ore extraction at major spodumene mine. Crushing and flotation circuits operating exclusively off diminishing surface stockpiles.",
        urgency: "Immediate (0–7 Days)",
        severity: "High (P2)",
      },
    ],
  },
  {
    id: "port_rail",
    name: "Port & Rail",
    iconName: "TrainTrack",
    fields: [
      {
        key: "portTerminal",
        label: "Port / Marine Terminal",
        placeholder: "e.g. Port of Los Angeles Pier 400",
      },
      {
        key: "railCorridor",
        label: "Rail Corridor / Carrier",
        placeholder: "e.g. BNSF Southern Transcon / Chicago Corridor",
      },
      {
        key: "cargoType",
        label: "Cargo Type & Intermodal Equipment",
        placeholder: "e.g. 40ft High-Cube Intermodal Containers & Well Cars",
      },
      {
        key: "capacityReduction",
        label: "Capacity Reduction / Dwell Time",
        placeholder: "e.g. Rail yard dwell spiked to 9.2 days (+140%)",
      },
      {
        key: "estimatedDelay",
        label: "Intermodal Delay Projection",
        placeholder: "e.g. 10–12 days delay to Midwestern assembly and distribution hubs",
        fullWidth: true,
      },
    ],
    commonScenarios: [
      {
        id: "rail_congestion",
        name: "Intermodal Freight Congestion",
        title: "Intermodal Railhead Chassis Deficit & Yard Congestion",
        narrative: "Inland intermodal interchange experiencing 9-day container dwell due to shortage of rail well cars and chassis return congestion across Midwestern junction points.",
        urgency: "Near-Term (1–3 Weeks)",
        severity: "High (P2)",
      },
      {
        id: "rail_crew_strike",
        name: "Rail Crew Strike",
        title: "Class I Railroad Locomotive Crew Work Stoppage",
        narrative: "National freight rail labor collective initiated localized walkout, halting intermodal double-stack trains across key transcontinental arterial corridors.",
        urgency: "Immediate (0–7 Days)",
        severity: "Critical (P1)",
      },
    ],
  },
  {
    id: "pharma",
    name: "Pharma Cold-Chain",
    iconName: "Pill",
    fields: [
      {
        key: "facility",
        label: "Manufacturing & Fill-Finish Facility",
        placeholder: "e.g. Leiden Biologics Center, Netherlands",
      },
      {
        key: "product",
        label: "Biopharmaceutical / Vaccine Product",
        placeholder: "e.g. Monoclonal Antibody Oncology Injectable",
      },
      {
        key: "tempRequirement",
        label: "Temperature Threshold & Tolerance",
        placeholder: "e.g. Strict 2°C to 8°C (Max excursion: <30 mins)",
      },
      {
        key: "shipmentStatus",
        label: "Consignment Status & Active Monitoring",
        placeholder: "e.g. Passive thermal shipper in transit, JFK cargo clearance",
      },
      {
        key: "coldChainRisk",
        label: "Excursion Exposure & Stability Horizon",
        placeholder: "e.g. Dry ice dry-out danger within 18 hours due to customs paperwork hold",
        fullWidth: true,
      },
    ],
    commonScenarios: [
      {
        id: "pharma_cold_chain_excursion",
        name: "Cold-Chain Excursion",
        title: "Temperature Excursion Warning on Cryogenic Consignment",
        narrative: "Active telemetry sensor alerted thermal logger drift above +6.5°C threshold during airport tarmac dwell. Stability budget remaining: 4.2 hours.",
        urgency: "Immediate (0–7 Days)",
        severity: "Critical (P1)",
      },
      {
        id: "pharma_api_shortage",
        name: "API Shortage",
        title: "Upstream Sterile API Batch Contamination & Recall",
        narrative: "Endotoxin spike in sterile fermentation bioreactor invalidated 3 primary API production lots, halting finished dosage vial fill-finish lines for 8 weeks.",
        urgency: "Near-Term (1–3 Weeks)",
        severity: "High (P2)",
      },
    ],
  },
  {
    id: "general",
    name: "General Multi-Tier",
    iconName: "Layers",
    fields: [
      {
        key: "supplier",
        label: "Tier-1 / Tier-2 Supplier Entity",
        placeholder: "e.g. Magna Powertrain Component Systems",
      },
      {
        key: "component",
        label: "Critical Part / Assembly Description",
        placeholder: "e.g. High-Pressure Aluminum Die-Cast Housing",
      },
      {
        key: "region",
        label: "Manufacturing Region / Corridor",
        placeholder: "e.g. Monterrey Industrial Corridor, Mexico",
      },
      {
        key: "dependency",
        label: "Single-Source Dependency Level",
        placeholder: "e.g. 100% single-tooled mold with no qualified backup",
      },
      {
        key: "disruptionDescription",
        label: "Bottleneck / Failure Mechanism",
        placeholder: "e.g. Tooling die fracture halted production lines; replacement tool lead-time 6 weeks",
        fullWidth: true,
      },
    ],
    commonScenarios: [
      {
        id: "general_single_source_failure",
        name: "Single-Source Tooling Failure",
        title: "Sole-Source High-Pressure Die Casting Tool Fracture",
        narrative: "Catastrophic fracture of unique mold die at Tier-1 facility. No secondary supplier qualified. Tooling replacement requires 6–8 weeks fabrication.",
        urgency: "Immediate (0–7 Days)",
        severity: "Critical (P1)",
      },
      {
        id: "general_supplier_insolvency",
        name: "Supplier Insolvency",
        title: "Tier-2 Sub-Assembly Supplier Emergency Restructuring",
        narrative: "Critical Tier-2 stamping vendor entered insolvency proceedings, freezing finished component release pending court-appointed receiver authorization.",
        urgency: "Immediate (0–7 Days)",
        severity: "High (P2)",
      },
    ],
  },
];

export interface DisruptionPreset {
  id: string;
  name: string;
  sectorId: IndustrySectorId;
  title: string;
  urgency: string;
  severity: string;
  narrative: string;
  sectorParameters: Record<string, string>;
  telemetry: Array<{ key: string; value: string }>;
}

export const CALIBRATED_PRESETS: DisruptionPreset[] = [
  {
    id: "semiconductor-fab-shutdown",
    name: "Semiconductor Fab Shutdown (Taiwan Cleanroom)",
    sectorId: "semiconductor",
    title: "Taiwan Fab 14A Seismic Foundry Cleanroom Shutdown",
    urgency: "Immediate (0–7 Days)",
    severity: "Critical (P1)",
    narrative:
      "A 6.8 magnitude seismic event forced automated vacuum shutdown and cleanroom decontamination across Hsinchu Fab 14A, halting production on 32-bit automotive microcontrollers.",
    sectorParameters: {
      fabricator: "Hsinchu Science Park, Fab 14A, Taiwan",
      component: "32-bit ASIL-D Automotive Body Control Microcontroller",
      packaging: "Tainan Advanced Packaging Center (ASE)",
      yieldDeficit: "40% wafer quota cut; 18 weeks lead-time extension",
      starvationRisk:
        "Vehicle electronics assembly lines face starvation within 11 days upon buffer depletion",
    },
    telemetry: [
      { key: "Factory Buffer Stock", value: "11 Days On-Hand" },
      {
        key: "Secondary Spot Market Availability",
        value: "Tight (< 5% global liquidity)",
      },
    ],
  },
  {
    id: "earthquake-natural-disaster",
    name: "Earthquake / Natural Disaster (Japan Kumamoto)",
    sectorId: "semiconductor",
    title: "Kyushu Seismic Shock & Power Inversion at Silicon Wafer Plant",
    urgency: "Immediate (0–7 Days)",
    severity: "Critical (P1)",
    narrative:
      "A magnitude 6.5 earthquake centered in Kumamoto caused electrical grid collapse, damaging quartz crystal pullers and thermal furnaces during active 300mm silicon ingot crystallization.",
    sectorParameters: {
      fabricator: "Kumamoto Silicon Materials Center, Japan",
      component: "300mm Prime Silicon Monocrystalline Wafers",
      packaging: "In-line raw ingot slicing facility",
      yieldDeficit: "Complete wafer furnace freeze; 6-week cleanup cycle",
      starvationRisk:
        "Secondary fab clients encounter ingot starvation within 16 operating days",
    },
    telemetry: [
      { key: "Regional Substation Status", value: "Grid offline for 72 hrs" },
      { key: "Global Raw Ingot Inventory", value: "18 Days Supply" },
    ],
  },
  {
    id: "port-congestion",
    name: "Port Congestion (Rotterdam & Antwerp Gateway)",
    sectorId: "port_rail",
    title: "North Sea Gateway Terminal Labor Strike & Vessel Queuing",
    urgency: "Near Term (1–4 Weeks)",
    severity: "High (P2)",
    narrative:
      "Unannounced 5-day rolling walkout across container gantry cranes at Antwerp-Bruges and Rotterdam has anchored 48 ultra-large container ships with berth delays surging to 11 days.",
    sectorParameters: {
      portTerminal: "ECT Delta Terminal, Port of Rotterdam",
      railCorridor: "Betuweroute freight corridor to Ruhr Valley",
      cargoType: "Automotive subassemblies & industrial machine tooling",
      capacityReduction: "Berth productivity degraded by 75%",
      estimatedDelay: "14-day cumulative transit delay into inland Europe",
    },
    telemetry: [
      { key: "Vessels at Anchor", value: "48 ships awaiting berth" },
      { key: "Average Yard Dwell", value: "12.4 days (+180%)" },
    ],
  },
  {
    id: "supplier-bankruptcy",
    name: "Supplier Bankruptcy (Tier-1 Chassis Fabricator)",
    sectorId: "general",
    title: "Insolvency & Receiver Lockout at Precision Hydroforming Partner",
    urgency: "Immediate (0–7 Days)",
    severity: "Critical (P1)",
    narrative:
      "Primary tier-1 supplier of hydroformed aluminum subframe components entered sudden bankruptcy administration, with bailiffs freezing factory gating and specialized manufacturing tooling.",
    sectorParameters: {
      supplier: "Apex Structural Hydroform GmbH (Germany)",
      component: "Lightweight High-Strength Aluminum Subframe Assemblies",
      region: "Baden-Württemberg Automotive Cluster",
      dependency: "100% single-sourced tooling owned under disputed lien",
      disruptionDescription:
        "Tooling locked behind legal receiver injunction; zero substitute capability available",
    },
    telemetry: [
      { key: "Assembly Plant Buffer", value: "6 Days Available" },
      { key: "Tooling Retrieval Timeline", value: "Estimated 21 days min" },
    ],
  },
  {
    id: "critical-raw-material-shortage",
    name: "Critical Raw Material Shortage (Battery Lithium & Nickel)",
    sectorId: "minerals",
    title: "Sovereign Quota Clamp on Unprocessed Spodumene Concentrates",
    urgency: "Medium Term (1–3 Months)",
    severity: "High (P2)",
    narrative:
      "Major mineral exporting authority enacted overnight export permitting quotas, withholding 35% of planned monthly spodumene concentrate shipments to overseas chemical converters.",
    sectorParameters: {
      mineRefinery: "Pilbara Basin Concentrate Operations",
      material: "Spodumene Lithium Ore 6% Concentrate (SC6)",
      supplierCountry: "Australia / Western Australia Port Authority",
      allocationDeficit: "35% reduction in export clearance quotas",
      alternativeSource:
        "Spot market pricing surged 42% with limited non-committed tons",
    },
    telemetry: [
      { key: "Spot Benchmark Price", value: "$1,450/ton (+42%)" },
      { key: "Conversion Buffer", value: "22 Days Operating Feed" },
    ],
  },
  {
    id: "factory-fire",
    name: "Factory Fire (Precision Optical Resin Plant)",
    sectorId: "general",
    title: "Thermal Curing Cleanroom Conflagration at Optical Sensor Hub",
    urgency: "Immediate (0–7 Days)",
    severity: "Critical (P1)",
    narrative:
      "A 3-alarm electrical fire destroyed specialized thermal autoclaves and clean packaging modules at our sole-source LIDAR lens polymer supplier, halting 90% of production capacity.",
    sectorParameters: {
      supplier: "Kyoto Polymer Precision Co.",
      component: "Anti-Reflective Optical Grade Cyclic Olefin Polymer",
      region: "Kansai Industrial Zone, Japan",
      dependency: "Sole supplier qualified for autonomous vehicle ADAS cameras",
      disruptionDescription:
        "Building 3 destroyed; reconstruction estimated at 6 to 9 months",
    },
    telemetry: [
      { key: "Finished Goods Stock", value: "14 Days On-Hand" },
      { key: "Requalification Lead Time", value: "16 Weeks Minimum" },
    ],
  },
  {
    id: "cyber-operational-disruption",
    name: "Cyber/Operational Disruption (Ransomware on Global TMS)",
    sectorId: "maritime",
    title: "Ransomware Infiltration of Tier-1 Logistics Forwarder TMS",
    urgency: "Immediate (0–7 Days)",
    severity: "Critical (P1)",
    narrative:
      "A targeted cyberattack disabled the enterprise EDI and container dispatch gateway of our primary ocean freight forwarder, preventing automated customs clearance and truck pickup EDI transmissions.",
    sectorParameters: {
      originPort: "Global Intermodal Network / 14 Ocean Hubs",
      destinationPort: "Long Beach, New York, Hamburg, Singapore",
      vesselRoute: "Global Ocean Freight Forwarding Network",
      portCongestion: "Containers accumulating demurrage at port terminals",
      estimatedDelay: "Manual paperwork recovery causing 7–10 days clearance stall",
    },
    telemetry: [
      { key: "EDI Integration Status", value: "Offline / Disconnected" },
      { key: "Container Count in Limbo", value: "340 Inbound TEUs" },
    ],
  },
  {
    id: "shipping-route-disruption",
    name: "Shipping Route Disruption (Bab-el-Mandeb Strait Reroute)",
    sectorId: "maritime",
    title: "Red Sea Maritime Security Diversion around Cape of Good Hope",
    urgency: "Near Term (1–4 Weeks)",
    severity: "High (P2)",
    narrative:
      "Escalating regional security threats forced container carriers to divert 85% of Asia-to-Europe liner services around southern Africa, adding 3,500 nautical miles and 12-16 days sailing time.",
    sectorParameters: {
      originPort: "Shanghai Port (CNSHG)",
      destinationPort: "Port of Hamburg (DEHAM)",
      vesselRoute: "Southern Africa Cape of Good Hope Route",
      portCongestion: "European receiving ports facing bunched vessel arrivals",
      estimatedDelay: "14 days transit delay + $1,800/FEU bunker surcharge",
    },
    telemetry: [
      { key: "Transit Time Delta", value: "+14 Days Sailing" },
      { key: "Fuel Bunker Surcharge", value: "+$1,800 per 40ft container" },
    ],
  },
  {
    id: "pharma-cold-chain-failure",
    name: "Pharma Cold-Chain Failure (Reefer Compressor Stall)",
    sectorId: "pharma",
    title: "Airport Tarmac Temperature Excursion on Critical Oncology Batch",
    urgency: "Immediate (0–7 Days)",
    severity: "Critical (P1)",
    narrative:
      "A ground refrigeration malfunction at O'Hare cargo transfer station left 8 pallets of temperature-sensitive mRNA lipid oncology drugs in 34°C direct sunlight for 3.5 hours.",
    sectorParameters: {
      facility: "Chicago O'Hare International Airport Cargo Area 5",
      product: "Lyophilized mRNA Oncological Formulation",
      tempRequirement: "Strict -20°C ± 5°C with tamper-evident dataloggers",
      shipmentStatus: "On tarmac awaiting customs re-clearance",
      coldChainRisk:
        "Datalogger shows temperature breached -10°C threshold; viability audit required",
    },
    telemetry: [
      { key: "Peak Recorded Temperature", value: "-4.2°C (excursion confirmed)" },
      { key: "Batch Valuation", value: "$4,200,000 retail value" },
    ],
  },
  {
    id: "geopolitical-trade-restriction",
    name: "Geopolitical Trade Restriction (Critical Rare Earth Export Controls)",
    sectorId: "minerals",
    title: "Immediate Dual-Use Export Licensing Restrictions on Heavy Rare Earths",
    urgency: "Medium Term (1–3 Months)",
    severity: "High (P2)",
    narrative:
      "Ministry of Commerce introduced mandatory individual export permits for Dysprosium and Terbium oxides used in high-efficiency electric vehicle drive motors, freezing pending customs declarations.",
    sectorParameters: {
      mineRefinery: "Baotou Rare Earth Refining Complex",
      material: "Dysprosium Oxide & Neodymium-Iron-Boron (NdFeB) Magnets",
      supplierCountry: "China",
      allocationDeficit: "60% of planned monthly export licenses withheld",
      alternativeSource: "Alternative processing in Europe at 4x lead time",
    },
    telemetry: [
      { key: "Export Permit Processing Delay", value: "60–90 Days" },
      { key: "EV Motor Assembly Buffer", value: "19 Days Remaining" },
    ],
  },
];

// Delivery Drift Benchmarks
export const DRIFT_BENCHMARK_EXAMPLES = [
  {
    id: "foxconn-baseline",
    name: "Foxconn MCUs — No Change Detected (Benchmark)",
    supplier: "Foxconn Technology Group",
    material: "Automotive-Grade 32-bit Microcontroller Units (MCUs)",
    poNumber: "PO-78492-AUT",
    originalDeliveryDate: "2026-10-15",
    requiredInPlantDate: "2026-10-20",
    riskCategory: "Supplier & Semiconductor Delays (Manufacturing)",
    latestCommunication:
      "Fab yield dip on high-reliability automotive microcontrollers; partial batch of 60% ready on schedule, balance deferred 18 days.",
    optionalDetails: {
      quantity: "50,000",
      unit: "Units",
      notes: "Direct SMT line delivery for Plant 4",
    },
  },
  {
    id: "tsmc-delay",
    name: "TSMC Wafer Foundry — 7 Days Variance",
    supplier: "TSMC Taiwan Foundry Services",
    material: "Power Management PMIC Silicon Wafers",
    poNumber: "PO-TSMC-2026-8819",
    originalDeliveryDate: "2026-10-08",
    requiredInPlantDate: "2026-10-12",
    riskCategory: "Supplier & Semiconductor Delays (Manufacturing)",
    latestCommunication:
      "Wafer foundry allocation reduced by 35% due to testing bottlenecks; dispatch postponed from original date to October 15 (+7 days).",
    optionalDetails: {
      quantity: "2,400",
      unit: "Wafers",
      notes: "Tape-out batch A-8819",
    },
  },
  {
    id: "maersk-reroute",
    name: "Maersk Ocean Line — 14 Days Reroute Variance",
    supplier: "A.P. Moller - Maersk",
    material: "Steel Stamping Assemblies & Chassis Hardware",
    poNumber: "PO-MAEU-2026-4401",
    originalDeliveryDate: "2026-10-01",
    requiredInPlantDate: "2026-10-05",
    riskCategory: "Logistics / Transportation",
    latestCommunication:
      "Vessel rerouting via Cape of Good Hope has revised estimated time of arrival at destination port to October 15, representing a 14-day schedule drift due to security avoidance.",
    optionalDetails: {
      quantity: "18",
      unit: "FEU Containers",
      notes: "Voyage 24E / Inbound Antwerp",
    },
  },
];

// Initial production state: empty arrays (no fabricated operational runs)
export const INITIAL_DISRUPTION_RUNS: DisruptionRun[] = [];
export const INITIAL_DRIFT_RUNS: DeliveryDriftRun[] = [];
