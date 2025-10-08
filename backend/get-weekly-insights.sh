#!/bin/bash

# Weekly Insights Generator Script
# This script calls the API to generate weekly insights for Jules Dating

echo "🚀 Generating Weekly Jules Dating Insights..."
echo "📅 Date: $(date)"
echo ""

# API endpoint
API_URL="http://localhost:3001/generate-weekly-insights"
TOKEN="steve-jules-insights-2025"

# Make the API call
echo "📡 Calling insights API..."
curl -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     "$API_URL" \
     | jq '.' 2>/dev/null || cat

echo ""
echo "✅ Weekly insights generated!"
echo "📧 Check the response above for your weekly data insights"
echo ""
echo "💡 You can copy the emailContent from the response and send it to users"
