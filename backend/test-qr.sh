#!/bin/bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ODcsInVzZXJJZCI6InRlc3Qtc3RhZmYiLCJhY2NvdW50VHlwZSI6ImNoaWxkIiwiaWF0IjoxNzYyNzUyNjYwLCJleHAiOjE3NjI4MzkwNjB9.ErrE2l7LjsmMhN6fu5fCwHs7IAbP4GCvL04i3T_AB8Y"

echo "🧪 Testing QR Code Generation..."
curl -s -X POST https://prudential-insurance-optimizer-qfn0i3jfh-kokiokumuras-projects.vercel.app/api/line/generate-qr \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"customerId": "42"}'
