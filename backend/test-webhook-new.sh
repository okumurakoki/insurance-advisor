#!/bin/bash
echo "🧪 Testing Webhook endpoint on new deployment..."
echo "URL: https://prudential-insurance-optimizer-5027tprp4-kokiokumuras-projects.vercel.app/api/line/webhook"
echo ""
curl -s -X POST https://prudential-insurance-optimizer-5027tprp4-kokiokumuras-projects.vercel.app/api/line/webhook \
  -H "Content-Type: application/json" \
  -d '{"events":[]}'
echo ""
echo ""
echo "✅ Webhook endpoint is accessible"
