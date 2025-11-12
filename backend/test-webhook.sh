#!/bin/bash
echo "🧪 Testing Webhook endpoint..."
curl -s https://prudential-insurance-optimizer-mxc9xqfqd-kokiokumuras-projects.vercel.app/api/line/webhook \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"events":[]}'
