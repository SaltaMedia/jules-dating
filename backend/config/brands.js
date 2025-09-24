// Brand configuration for Jules Style - Product recommendations and style guidance
const brands = {
  // ATHLETIC WEAR & ATHLEISURE
  athletic: {
    nike: {
      category: "Athletic Wear",
      vibe: "Sporty/Urban/Versatile",
      budget: "mid-range",
      specialties: ["sneakers", "athletic wear", "training gear"],
      priceRange: "$50-200"
    },
    adidas: {
      category: "Athletic Wear",
      vibe: "Classic/Streetwear influenced",
      budget: "mid-range",
      specialties: ["sneakers", "athletic wear", "streetwear"],
      priceRange: "$50-200"
    },
    lululemon: {
      category: "Athleisure",
      vibe: "Clean, performance-forward",
      budget: "premium",
      specialties: ["athleisure", "performance wear", "lifestyle"],
      priceRange: "$80-200"
    },
    vuori: {
      category: "Athleisure",
      vibe: "Coastal, comfortable",
      budget: "premium",
      specialties: ["athleisure", "comfort wear", "coastal style"],
      priceRange: "$60-150"
    },
    "ten thousand": {
      category: "Training Wear",
      vibe: "Minimalist, high-performance",
      budget: "premium",
      specialties: ["training wear", "minimalist", "performance"],
      priceRange: "$40-120"
    },
    rhone: {
      category: "Athleisure",
      vibe: "Polished, functional",
      budget: "premium",
      specialties: ["athleisure", "polished", "functional"],
      priceRange: "$60-150"
    },
    gymshark: {
      category: "Gymwear",
      vibe: "Tight-fit, gym-forward",
      budget: "mid-range",
      specialties: ["gymwear", "fitted", "performance"],
      priceRange: "$30-100"
    },
    "alo yoga": {
      category: "Athleisure",
      vibe: "Trendy, fitted, urban",
      budget: "premium",
      specialties: ["athleisure", "trendy", "urban"],
      priceRange: "$70-150"
    },
    "outdoor voices": {
      category: "Athleisure",
      vibe: "Playful, casual",
      budget: "premium",
      specialties: ["athleisure", "playful", "casual"],
      priceRange: "$50-120"
    },
    "under armour": {
      category: "Athletic Wear",
      vibe: "Technical, rugged",
      budget: "mid-range",
      specialties: ["athletic wear", "technical", "rugged"],
      priceRange: "$40-150"
    }
  },

  // SNEAKERS
  sneakers: {
    nike: {
      category: "Sneakers",
      vibe: "Casual/Street",
      budget: "mid-range",
      specialties: ["casual sneakers", "street style", "versatile"],
      priceRange: "$60-200"
    },
    adidas: {
      category: "Sneakers",
      vibe: "Casual/Street",
      budget: "mid-range",
      specialties: ["casual sneakers", "street style", "classic"],
      priceRange: "$60-200"
    },
    "new balance": {
      category: "Sneakers",
      vibe: "Casual/Street",
      budget: "mid-range",
      specialties: ["casual sneakers", "comfort", "retro"],
      priceRange: "$80-200"
    },
    veja: {
      category: "Sneakers",
      vibe: "Casual/Street",
      budget: "mid-range",
      specialties: ["sustainable", "minimalist", "casual"],
      priceRange: "$80-150"
    },
    converse: {
      category: "Sneakers",
      vibe: "Casual/Street",
      budget: "budget",
      specialties: ["classic", "versatile", "timeless"],
      priceRange: "$50-80"
    },
    vans: {
      category: "Sneakers",
      vibe: "Casual/Street",
      budget: "budget",
      specialties: ["skate", "casual", "versatile"],
      priceRange: "$50-80"
    },
    "common projects": {
      category: "Sneakers",
      vibe: "Casual/Street",
      budget: "luxury",
      specialties: ["minimalist", "luxury", "clean"],
      priceRange: "$300-500"
    }
  },

  // CASUAL LOAFERS
  casualLoafers: {
    sperry: {
      category: "Casual Loafers",
      vibe: "Smart Casual/Preppy",
      budget: "mid-range",
      specialties: ["boat shoes", "preppy", "casual"],
      priceRange: "$80-150"
    },
    "g.h. bass": {
      category: "Casual Loafers",
      vibe: "Smart Casual/Preppy",
      budget: "mid-range",
      specialties: ["weejuns", "preppy", "classic"],
      priceRange: "$80-150"
    },
    "cole haan": {
      category: "Casual Loafers",
      vibe: "Smart Casual/Preppy",
      budget: "mid-range",
      specialties: ["comfort", "business casual", "versatile"],
      priceRange: "$100-200"
    },
    "johnston & murphy": {
      category: "Casual Loafers",
      vibe: "Smart Casual/Preppy",
      budget: "mid-range",
      specialties: ["business casual", "classic", "quality"],
      priceRange: "$120-200"
    },
    m_gemi: {
      category: "Casual Loafers",
      vibe: "Smart Casual/Preppy",
      budget: "premium",
      specialties: ["luxury", "handcrafted", "premium"],
      priceRange: "$200-400"
    }
  },

  // BOOTS
  boots: {
    "red wing": {
      category: "Boots",
      vibe: "Rugged/Heritage",
      budget: "premium",
      specialties: ["work boots", "heritage", "durable"],
      priceRange: "$200-400"
    },
    "thursday boots": {
      category: "Boots",
      vibe: "Rugged/Heritage",
      budget: "mid-range",
      specialties: ["heritage", "quality", "affordable luxury"],
      priceRange: "$150-250"
    },
    timberland: {
      category: "Boots",
      vibe: "Rugged/Heritage",
      budget: "mid-range",
      specialties: ["work boots", "outdoor", "durable"],
      priceRange: "$150-250"
    },
    "dr. martens": {
      category: "Boots",
      vibe: "Rugged/Heritage",
      budget: "mid-range",
      specialties: ["punk", "durable", "statement"],
      priceRange: "$150-250"
    },
    blundstone: {
      category: "Boots",
      vibe: "Rugged/Heritage",
      budget: "mid-range",
      specialties: ["chelsea boots", "comfortable", "versatile"],
      priceRange: "$150-250"
    }
  },

  // DRESS SHOES
  dressShoes: {
    "allen edmonds": {
      category: "Dress Shoes",
      vibe: "Classic/Formal",
      budget: "premium",
      specialties: ["classic", "quality", "business formal"],
      priceRange: "$200-400"
    },
    "beckett simonon": {
      category: "Dress Shoes",
      vibe: "Classic/Formal",
      budget: "mid-range",
      specialties: ["direct to consumer", "quality", "affordable luxury"],
      priceRange: "$150-250"
    },
    magnanni: {
      category: "Dress Shoes",
      vibe: "Classic/Formal",
      budget: "premium",
      specialties: ["luxury", "handcrafted", "premium"],
      priceRange: "$300-600"
    },
    "to boot new york": {
      category: "Dress Shoes",
      vibe: "Classic/Formal",
      budget: "premium",
      specialties: ["luxury", "modern classic", "premium"],
      priceRange: "$300-600"
    }
  },

  // TRENDY/LUXURY
  trendyLuxury: {
    "oliver cabell": {
      category: "Trendy/Luxury",
      vibe: "Luxury/Statement",
      budget: "luxury",
      specialties: ["luxury", "minimalist", "statement"],
      priceRange: "$400-800"
    },
    koio: {
      category: "Trendy/Luxury",
      vibe: "Luxury/Statement",
      budget: "luxury",
      specialties: ["luxury", "minimalist", "premium"],
      priceRange: "$300-600"
    },
    gucci: {
      category: "Trendy/Luxury",
      vibe: "Luxury/Statement",
      budget: "luxury",
      specialties: ["luxury", "statement", "designer"],
      priceRange: "$500-2000"
    },
    balenciaga: {
      category: "Trendy/Luxury",
      vibe: "Luxury/Statement",
      budget: "luxury",
      specialties: ["luxury", "avant-garde", "designer"],
      priceRange: "$500-2000"
    }
  },

  // BASICS
  basics: {
    uniqlo: {
      category: "Basics",
      vibe: "Affordable/Minimalist",
      budget: "budget",
      specialties: ["basics", "minimalist", "affordable"],
      priceRange: "$20-80"
    },
    everlane: {
      category: "Basics",
      vibe: "Affordable/Minimalist",
      budget: "mid-range",
      specialties: ["basics", "ethical", "minimalist"],
      priceRange: "$40-150"
    },
    "buck mason": {
      category: "Everyday Basics",
      vibe: "Clean, modern Americana",
      budget: "mid-range",
      specialties: ["basics", "california", "casual", "americana"],
      priceRange: "$50-150"
    },
    gap: {
      category: "Basics",
      vibe: "Affordable/Minimalist",
      budget: "budget",
      specialties: ["basics", "casual", "versatile"],
      priceRange: "$30-100"
    },
    "banana republic": {
      category: "Basics",
      vibe: "Affordable/Minimalist",
      budget: "mid-range",
      specialties: ["basics", "business casual", "versatile"],
      priceRange: "$50-200"
    },
    muji: {
      category: "Basics",
      vibe: "Affordable/Minimalist",
      budget: "budget",
      specialties: ["basics", "minimalist", "japanese"],
      priceRange: "$20-80"
    },
    jungmaven: {
      category: "Hempwear Basics",
      vibe: "Earthy, relaxed, sustainable",
      budget: "mid-range",
      specialties: ["hemp", "sustainable", "relaxed", "earthy"],
      priceRange: "$40-120"
    }
  },

  // MID-TIER CASUAL
  midTierCasual: {
    "j.crew": {
      category: "Mid-Tier Casual",
      vibe: "Elevated Basics/Smart Casual",
      budget: "mid-range",
      specialties: ["smart casual", "preppy", "versatile"],
      priceRange: "$60-200"
    },
    bonobos: {
      category: "Mid-Tier Casual",
      vibe: "Elevated Basics/Smart Casual",
      budget: "mid-range",
      specialties: ["fitted", "smart casual", "online"],
      priceRange: "$70-200"
    },
    "todd snyder": {
      category: "Mid-Tier Casual",
      vibe: "Elevated Basics/Smart Casual",
      budget: "premium",
      specialties: ["luxury basics", "premium", "quality"],
      priceRange: "$100-300"
    },
    abercrombie: {
      category: "Mid-Tier Casual",
      vibe: "Elevated Basics/Smart Casual",
      budget: "mid-range",
      specialties: ["casual", "young", "trendy"],
      priceRange: "$50-150"
    },
    reiss: {
      category: "Mid-Tier Casual",
      vibe: "Elevated Basics/Smart Casual",
      budget: "premium",
      specialties: ["smart casual", "british", "quality"],
      priceRange: "$100-300"
    },
    "taylor stitch": {
      category: "Elevated Basics",
      vibe: "Heritage workwear, sustainable, clean",
      budget: "mid-range",
      specialties: ["heritage", "workwear", "sustainable", "clean"],
      priceRange: "$80-200"
    },
    "flint and tinder": {
      category: "Elevated Basics",
      vibe: "Utility-inspired, made in USA",
      budget: "mid-range",
      specialties: ["utility", "made in usa", "quality", "basics"],
      priceRange: "$80-200"
    },
    "alex mill": {
      category: "Everyday Staples",
      vibe: "Clean, quirky-prep, urban classic",
      budget: "mid-range",
      specialties: ["preppy", "urban", "classic", "quirky"],
      priceRange: "$60-180"
    }
  },

  // PREMIUM/DESIGNER
  premiumDesigner: {
    "a.p.c.": {
      category: "Premium/Designer",
      vibe: "Modern/Designer",
      budget: "luxury",
      specialties: ["minimalist", "french", "designer"],
      priceRange: "$200-600"
    },
    "rag & bone": {
      category: "Premium/Designer",
      vibe: "Modern/Designer",
      budget: "luxury",
      specialties: ["modern", "new york", "designer"],
      priceRange: "$200-600"
    },
    "acne studios": {
      category: "Premium/Designer",
      vibe: "Modern/Designer",
      budget: "luxury",
      specialties: ["avant-garde", "swedish", "designer"],
      priceRange: "$300-800"
    },
    ami: {
      category: "Premium/Designer",
      vibe: "Modern/Designer",
      budget: "luxury",
      specialties: ["french", "modern", "designer"],
      priceRange: "$200-600"
    },
    "john elliott": {
      category: "Premium/Designer",
      vibe: "Modern/Designer",
      budget: "luxury",
      specialties: ["streetwear", "luxury", "california"],
      priceRange: "$200-600"
    }
  },

  // STREETWEAR
  streetwear: {
    "carhartt wip": {
      category: "Streetwear",
      vibe: "Cool Downtown/Hype",
      budget: "mid-range",
      specialties: ["workwear", "streetwear", "durable"],
      priceRange: "$60-200"
    },
    stussy: {
      category: "Streetwear",
      vibe: "Cool Downtown/Hype",
      budget: "mid-range",
      specialties: ["streetwear", "california", "heritage"],
      priceRange: "$40-150"
    },
    "fear of god essentials": {
      category: "Streetwear",
      vibe: "Cool Downtown/Hype",
      budget: "premium",
      specialties: ["luxury streetwear", "minimalist", "hype"],
      priceRange: "$100-300"
    },
    supreme: {
      category: "Streetwear",
      vibe: "Cool Downtown/Hype",
      budget: "premium",
      specialties: ["hype", "limited", "streetwear"],
      priceRange: "$50-500"
    },
    kith: {
      category: "Streetwear",
      vibe: "Cool Downtown/Hype",
      budget: "premium",
      specialties: ["luxury streetwear", "new york", "premium"],
      priceRange: "$100-400"
    },
    rvca: {
      category: "Streetwear/Casual",
      vibe: "Surf/skate, minimalist edge",
      budget: "mid-range",
      specialties: ["surf", "skate", "minimalist", "streetwear"],
      priceRange: "$40-120"
    },
    "banks journal": {
      category: "Coastal Streetwear",
      vibe: "Understated surf/skate",
      budget: "mid-range",
      specialties: ["surf", "skate", "coastal", "minimalist"],
      priceRange: "$50-150"
    },
    "saturdays nyc": {
      category: "Urban Surfwear",
      vibe: "Luxe surf aesthetic, fashion-forward",
      budget: "premium",
      specialties: ["surf", "luxury", "urban", "fashion-forward"],
      priceRange: "$80-200"
    }
  },

  // WORKWEAR/RUGGED
  workwearRugged: {
    filson: {
      category: "Workwear/Rugged",
      vibe: "Utility/Rugged",
      budget: "premium",
      specialties: ["workwear", "heritage", "durable"],
      priceRange: "$150-400"
    },
    "flint and tinder": {
      category: "Workwear/Rugged",
      vibe: "Utility/Rugged",
      budget: "mid-range",
      specialties: ["workwear", "quality", "american"],
      priceRange: "$80-200"
    },
    "taylor stitch": {
      category: "Workwear/Rugged",
      vibe: "Utility/Rugged",
      budget: "mid-range",
      specialties: ["workwear", "california", "quality"],
      priceRange: "$80-200"
    },
    huckberry: {
      category: "Workwear/Rugged",
      vibe: "Utility/Rugged",
      budget: "mid-range",
      specialties: ["curated", "adventure", "quality"],
      priceRange: "$80-200"
    },
    roark: {
      category: "Adventure Casual",
      vibe: "Rugged, global explorer, moto-inspired",
      budget: "mid-range",
      specialties: ["adventure", "moto-inspired", "global", "rugged"],
      priceRange: "$60-200"
    },
    "howler brothers": {
      category: "Southern Outdoor",
      vibe: "Texas-meets-surf, outdoorsman charm",
      budget: "mid-range",
      specialties: ["southern", "outdoor", "surf", "texas"],
      priceRange: "$50-150"
    }
  },

  // OUTDOOR INSPIRED
  outdoorInspired: {
    patagonia: {
      category: "Outdoor Inspired",
      vibe: "Adventure/Functional",
      budget: "premium",
      specialties: ["outdoor", "sustainable", "functional"],
      priceRange: "$80-300"
    },
    "the north face": {
      category: "Outdoor Inspired",
      vibe: "Adventure/Functional",
      budget: "mid-range",
      specialties: ["outdoor", "technical", "durable"],
      priceRange: "$60-250"
    },
    arcteryx: {
      category: "Outdoor Inspired",
      vibe: "Adventure/Functional",
      budget: "luxury",
      specialties: ["technical", "premium", "performance"],
      priceRange: "$200-600"
    },
    cotopaxi: {
      category: "Outdoor Inspired",
      vibe: "Adventure/Functional",
      budget: "mid-range",
      specialties: ["outdoor", "sustainable", "colorful"],
      priceRange: "$60-200"
    }
  },

  // COASTAL/SUSTAINABLE
  coastalSustainable: {
    "marine layer": {
      category: "Elevated Casual",
      vibe: "Soft, coastal, easygoing California",
      budget: "mid-range",
      specialties: ["coastal", "california", "soft", "easygoing"],
      priceRange: "$50-150"
    },
    outerknown: {
      category: "Sustainable Casual",
      vibe: "Relaxed, travel-forward, ethical",
      budget: "premium",
      specialties: ["sustainable", "travel", "ethical", "relaxed"],
      priceRange: "$80-200"
    },
    faherty: {
      category: "Coastal Preppy",
      vibe: "Polished boho, beach-to-city versatile",
      budget: "mid-range",
      specialties: ["coastal", "preppy", "boho", "versatile"],
      priceRange: "$60-180"
    },
    wellen: {
      category: "Sustainable Surf",
      vibe: "Laid-back, eco-conscious, beachwear",
      budget: "mid-range",
      specialties: ["surf", "sustainable", "beachwear", "eco-conscious"],
      priceRange: "$40-120"
    }
  },

  // OFFICE/ELEVATED
  officeElevated: {
    "club monaco": {
      category: "Office/Elevated",
      vibe: "Clean Preppy/Business Casual",
      budget: "mid-range",
      specialties: ["business casual", "preppy", "versatile"],
      priceRange: "$80-250"
    },
    suitsupply: {
      category: "Office/Elevated",
      vibe: "Clean Preppy/Business Casual",
      budget: "premium",
      specialties: ["suits", "business", "quality"],
      priceRange: "$400-800"
    },
    "charles tyrwhitt": {
      category: "Office/Elevated",
      vibe: "Clean Preppy/Business Casual",
      budget: "mid-range",
      specialties: ["shirts", "business", "british"],
      priceRange: "$80-150"
    },
    indochino: {
      category: "Office/Elevated",
      vibe: "Clean Preppy/Business Casual",
      budget: "mid-range",
      specialties: ["custom suits", "affordable", "online"],
      priceRange: "$300-600"
    },
    theory: {
      category: "Office/Elevated",
      vibe: "Clean Preppy/Business Casual",
      budget: "premium",
      specialties: ["business", "minimalist", "quality"],
      priceRange: "$200-500"
    }
  },

  // ACCESSORIES
  accessories: {
    // Watches
    timex: {
      category: "Watches",
      vibe: "Accessories/Timeless",
      budget: "budget",
      specialties: ["affordable", "classic", "reliable"],
      priceRange: "$30-100"
    },
    seiko: {
      category: "Watches",
      vibe: "Accessories/Timeless",
      budget: "mid-range",
      specialties: ["quality", "japanese", "reliable"],
      priceRange: "$100-500"
    },
    hamilton: {
      category: "Watches",
      vibe: "Accessories/Timeless",
      budget: "premium",
      specialties: ["swiss", "classic", "quality"],
      priceRange: "$400-1000"
    },
    tissot: {
      category: "Watches",
      vibe: "Accessories/Timeless",
      budget: "mid-range",
      specialties: ["swiss", "quality", "affordable luxury"],
      priceRange: "$200-800"
    },
    casio: {
      category: "Watches",
      vibe: "Accessories/Timeless",
      budget: "budget",
      specialties: ["affordable", "reliable", "functional"],
      priceRange: "$20-100"
    },
    omega: {
      category: "Watches",
      vibe: "Accessories/Timeless",
      budget: "luxury",
      specialties: ["luxury", "swiss", "prestige"],
      priceRange: "$3000-10000"
    },
    shinola: {
      category: "Watches",
      vibe: "Accessories/Timeless",
      budget: "premium",
      specialties: ["american", "detroit", "quality"],
      priceRange: "$400-1000"
    },

    // Sunglasses
    "ray-ban": {
      category: "Sunglasses",
      vibe: "Accessories/Stylish",
      budget: "mid-range",
      specialties: ["classic", "versatile", "quality"],
      priceRange: "$100-300"
    },
    persol: {
      category: "Sunglasses",
      vibe: "Accessories/Stylish",
      budget: "premium",
      specialties: ["italian", "luxury", "quality"],
      priceRange: "$200-500"
    },
    "warby parker": {
      category: "Sunglasses",
      vibe: "Accessories/Stylish",
      budget: "mid-range",
      specialties: ["affordable", "direct to consumer", "stylish"],
      priceRange: "$95-150"
    },
    "oliver peoples": {
      category: "Sunglasses",
      vibe: "Accessories/Stylish",
      budget: "premium",
      specialties: ["luxury", "california", "quality"],
      priceRange: "$300-600"
    },
    "garrett leight": {
      category: "Sunglasses",
      vibe: "Accessories/Stylish",
      budget: "premium",
      specialties: ["luxury", "california", "modern"],
      priceRange: "$200-400"
    },

    // Belts & Wallets
    "tanner goods": {
      category: "Belts & Wallets",
      vibe: "Accessories/Everyday",
      budget: "mid-range",
      specialties: ["leather", "handcrafted", "quality"],
      priceRange: "$50-150"
    },
    bellroy: {
      category: "Belts & Wallets",
      vibe: "Accessories/Everyday",
      budget: "mid-range",
      specialties: ["minimalist", "functional", "quality"],
      priceRange: "$40-120"
    },
    fossil: {
      category: "Belts & Wallets",
      vibe: "Accessories/Everyday",
      budget: "budget",
      specialties: ["affordable", "versatile", "casual"],
      priceRange: "$30-80"
    },
    coach: {
      category: "Belts & Wallets",
      vibe: "Accessories/Everyday",
      budget: "mid-range",
      specialties: ["american", "quality", "classic"],
      priceRange: "$50-200"
    },

    // Bags
    herschel: {
      category: "Bags",
      vibe: "Accessories/Utility",
      budget: "budget",
      specialties: ["casual", "affordable", "versatile"],
      priceRange: "$40-100"
    },
    aer: {
      category: "Bags",
      vibe: "Accessories/Utility",
      budget: "mid-range",
      specialties: ["functional", "modern", "quality"],
      priceRange: "$80-200"
    },
    away: {
      category: "Bags",
      vibe: "Accessories/Utility",
      budget: "premium",
      specialties: ["travel", "modern", "quality"],
      priceRange: "$200-400"
    },
    "topo designs": {
      category: "Bags",
      vibe: "Accessories/Utility",
      budget: "mid-range",
      specialties: ["outdoor", "colorful", "functional"],
      priceRange: "$60-150"
    },

    // Jewelry
    miansai: {
      category: "Jewelry",
      vibe: "Accessories/Statement",
      budget: "mid-range",
      specialties: ["minimalist", "modern", "quality"],
      priceRange: "$50-200"
    },
    mejuri: {
      category: "Jewelry",
      vibe: "Accessories/Statement",
      budget: "mid-range",
      specialties: ["minimalist", "direct to consumer", "quality"],
      priceRange: "$50-300"
    },
    "clocks & colours": {
      category: "Jewelry",
      vibe: "Accessories/Statement",
      budget: "mid-range",
      specialties: ["minimalist", "modern", "quality"],
      priceRange: "$50-200"
    },
    "david yurman": {
      category: "Jewelry",
      vibe: "Accessories/Statement",
      budget: "luxury",
      specialties: ["luxury", "american", "premium"],
      priceRange: "$200-1000"
    },

    // Hats
    brixton: {
      category: "Hats",
      vibe: "Accessories/Casual",
      budget: "budget",
      specialties: ["casual", "california", "versatile"],
      priceRange: "$30-60"
    },
    "new era": {
      category: "Hats",
      vibe: "Accessories/Casual",
      budget: "budget",
      specialties: ["baseball caps", "sports", "casual"],
      priceRange: "$20-50"
    },
    carhartt: {
      category: "Hats",
      vibe: "Accessories/Casual",
      budget: "budget",
      specialties: ["workwear", "durable", "casual"],
      priceRange: "$20-50"
    },
    "goorin bros.": {
      category: "Hats",
      vibe: "Accessories/Casual",
      budget: "mid-range",
      specialties: ["heritage", "quality", "classic"],
      priceRange: "$40-100"
    }
  },

  // GROOMING
  grooming: {
    "jack black": {
      category: "Grooming",
      vibe: "Self Care/Polished",
      budget: "premium",
      specialties: ["skincare", "premium", "quality"],
      priceRange: "$20-60"
    },
    kiehls: {
      category: "Grooming",
      vibe: "Self Care/Polished",
      budget: "premium",
      specialties: ["skincare", "apothecary", "quality"],
      priceRange: "$20-80"
    },
    cremo: {
      category: "Grooming",
      vibe: "Self Care/Polished",
      budget: "budget",
      specialties: ["shaving", "affordable", "quality"],
      priceRange: "$10-30"
    },
    harrys: {
      category: "Grooming",
      vibe: "Self Care/Polished",
      budget: "mid-range",
      specialties: ["shaving", "subscription", "quality"],
      priceRange: "$15-40"
    },
    "every man jack": {
      category: "Grooming",
      vibe: "Self Care/Polished",
      budget: "budget",
      specialties: ["natural", "affordable", "quality"],
      priceRange: "$8-25"
    },
    "dollar shave club": {
      category: "Grooming",
      vibe: "Self Care/Polished",
      budget: "budget",
      specialties: ["shaving", "subscription", "affordable"],
      priceRange: "$5-20"
    }
  },

  // LUXURY
  luxury: {
    armani: {
      category: "Luxury",
      vibe: "Luxury/Statement",
      budget: "luxury",
      specialties: ["luxury", "italian", "prestige"],
      priceRange: "$500-3000"
    },
    gucci: {
      category: "Luxury",
      vibe: "Luxury/Statement",
      budget: "luxury",
      specialties: ["luxury", "italian", "statement"],
      priceRange: "$500-5000"
    },
    versace: {
      category: "Luxury",
      vibe: "Luxury/Statement",
      budget: "luxury",
      specialties: ["luxury", "italian", "bold"],
      priceRange: "$500-3000"
    },
    burberry: {
      category: "Luxury",
      vibe: "Luxury/Statement",
      budget: "luxury",
      specialties: ["luxury", "british", "heritage"],
      priceRange: "$500-3000"
    },
    prada: {
      category: "Luxury",
      vibe: "Luxury/Statement",
      budget: "luxury",
      specialties: ["luxury", "italian", "sophisticated"],
      priceRange: "$500-5000"
    }
  }
};

// Helper functions for Jules to use
const brandHelpers = {
  // Get brand by name
  getBrand: (brandName) => {
    const normalizedName = brandName.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const category in brands) {
      for (const brand in brands[category]) {
        if (brand.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedName) {
          return brands[category][brand];
        }
      }
    }
    return null;
  },

  // Get brands by budget
  getBrandsByBudget: (budget) => {
    const results = [];
    for (const category in brands) {
      for (const brand in brands[category]) {
        if (brands[category][brand].budget === budget) {
          results.push({ name: brand, ...brands[category][brand] });
        }
      }
    }
    return results;
  },

  // Get brands by category
  getBrandsByCategory: (category) => {
    return brands[category] ? Object.keys(brands[category]).map(brand => ({
      name: brand,
      ...brands[category][brand]
    })) : [];
  },

  // Get brands by vibe
  getBrandsByVibe: (vibe) => {
    const results = [];
    for (const category in brands) {
      for (const brand in brands[category]) {
        if (brands[category][brand].vibe.toLowerCase().includes(vibe.toLowerCase())) {
          results.push({ name: brand, ...brands[category][brand] });
        }
      }
    }
    return results;
  },

  // Get budget recommendations based on user preferences
  getBudgetRecommendations: (userBudget, category = null) => {
    const budgetMap = {
      'budget': ['budget', 'mid-range'],
      'mid-range': ['budget', 'mid-range', 'premium'],
      'premium': ['mid-range', 'premium', 'luxury'],
      'luxury': ['premium', 'luxury']
    };

    const targetBudgets = budgetMap[userBudget] || ['mid-range'];
    const results = [];

    for (const budget of targetBudgets) {
      for (const cat in brands) {
        if (category && cat !== category) continue;
        for (const brand in brands[cat]) {
          if (brands[cat][brand].budget === budget) {
            results.push({ name: brand, ...brands[cat][brand] });
          }
        }
      }
    }

    return results;
  }
};

module.exports = { brands, brandHelpers }; 