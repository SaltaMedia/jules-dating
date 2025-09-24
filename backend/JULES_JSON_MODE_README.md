# Jules JSON Mode Implementation

## Overview
This implementation adds structured JSON output for outfit recommendations while maintaining backward compatibility through a feature flag system.

## Feature Flags

### JULES_JSON_MODE
- `off`: Traditional prose responses (default)
- `shadow`: JSON internally, prose to frontend, logs JSON
- `on`: Pure JSON responses (frontend must handle)

### JULES_JSON_SAMPLE
- `0.0` to `1.0`: Percentage of requests to use JSON mode
- `1.0`: All requests use JSON mode

### LOG_JSON
- `1`: Log JSON responses in shadow mode
- `0`: Don't log JSON responses

## New Services

### 1. `services/safeLoad.js`
- `safeRequire(path, fallback)`: Robust module loading with fallbacks

### 2. `services/weather.js`
- `weatherBucket(tempF)`: Categorizes temperature into weather buckets

### 3. `services/intentMap.js`
- `normalizeIntent(raw)`: Standardizes intent classifications

### 4. `services/renderers.js`
- `renderOutfitJsonToProse(json)`: Converts JSON back to prose

### 5. `services/recommendOutfits.js`
- `recommendOutfits(user, context, closet)`: Generates diverse outfit options

### 6. `utils/buildContextShim.js`
- `buildUserContext(userId, UserProfile, User)`: Compatibility layer for user context

## Data Files

### `seed/palette.json`
Comprehensive outfit database with:
- Style principles
- Weather-appropriate textiles
- Archetype rules
- Color combinations
- Body type guidance
- Sample outfits with reasoning

### `seed/dating.json`
Dating advice principles and examples

### `seed/confidence.json`
Confidence building techniques and tips

## Testing

Run the test suite:
```bash
node test-json-mode.js
```

## Deployment

### Phase 1: Shadow Mode
```bash
JULES_JSON_MODE=shadow JULES_JSON_SAMPLE=1.0 LOG_JSON=1 npm start
```

### Phase 2: Full JSON Mode
```bash
JULES_JSON_MODE=on npm start
```

## JSON Response Format

### Outfit Recommendations
```json
{
  "outfits": [
    {
      "name": "Coffee Classic",
      "items": ["OCBD (white)", "stone chinos", "minimal white sneakers", "denim jacket"],
      "why": "Clean, textured look with low-stakes polish",
      "swaps": ["swap loafers→sneakers for dressier", "swap denim jacket→field jacket for wind"]
    }
  ],
  "meta": {
    "occasion": "date_coffee",
    "archetype_bias": [],
    "weather_note": "mild_55_75",
    "body_type_note": "unknown"
  }
}
```

### Product Recommendations
```json
{
  "products": [
    {
      "title": "Product Name",
      "url": "https://...",
      "price": "$99",
      "brand": "Brand Name"
    }
  ],
  "notes": "Optional prose notes"
}
```

## Benefits

1. **Diverse Recommendations**: No more repetitive "dark jeans + button-up + bomber jacket"
2. **Structured Data**: Frontend can process and display outfits programmatically
3. **Context Awareness**: Weather, occasion, and user preferences inform recommendations
4. **Backward Compatibility**: Existing frontend continues to work
5. **Learning Integration**: Maintains conversation learning and user context
