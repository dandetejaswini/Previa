export interface SupplyImage {
  src: string;
  alt: string;
  caption?: string;
  tag?: string;
}

export const PREVIA_IMAGERY = {
  // Hero & Global Logistics
  heroContainerPort: {
    src: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1600&q=80",
    alt: "Deepwater intermodal container terminal at dusk with heavy-lift gantry cranes and freight stacks",
    caption: "Port of Rotterdam Maasvlakte II — Automated deepwater container terminal operations",
    tag: "Maritime Hub",
  },
  // Ocean Freight & Vessel Transit
  oceanVesselTransit: {
    src: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=1600&q=80",
    alt: "Container vessel navigating oceanic maritime trade lane under overcast sky",
    caption: "Transpacific Northern Corridor — Ultra-large container carrier in transit",
    tag: "Vessel Drift",
  },
  // Automated Warehouse & Racking Distribution
  automatedDistributionCenter: {
    src: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80",
    alt: "High-bay automated distribution warehouse with precision pallet racking and staging lanes",
    caption: "Tier-1 Intermodal Fulfillment Facility — Real-time inventory buffer horizon",
    tag: "Safety Buffer",
  },
  // Rail Freight & Intermodal Corridor
  intermodalFreightRail: {
    src: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1600&q=80",
    alt: "Freight rail transit yard with container wagons on ballast tracks",
    caption: "Trans-Eurasian rail freight corridor connecting inland industrial assembly nodes",
    tag: "Rail Transit",
  },
  // Precision Fabrication & High-Tech Components
  precisionSemiconductorFoundry: {
    src: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80",
    alt: "Automotive-grade silicon wafer microstructure and integrated circuit substrate",
    caption: "32-bit automotive microcontroller wafer fabrication & cleanroom packaging line",
    tag: "Component Tier",
  },
  // Air Cargo & Urgent Expedited Logistics
  expeditedAirCargo: {
    src: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=1600&q=80",
    alt: "Industrial cargo air freight apron with palletized unit load devices at twilight",
    caption: "Express air-cargo buffer mitigation for critical assembly starvation prevention",
    tag: "Expedited Mitigation",
  },
  // Operational Control Room / Maritime Ops
  controlTowerMonitoring: {
    src: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1600&q=80",
    alt: "Industrial operations coordination overlooking deepwater shipping fairway",
    caption: "Previa Operational Control — Continuous multi-modal telemetry synthesis",
    tag: "Telemetry Stream",
  },
};
