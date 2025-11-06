#!/bin/bash

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3MjgyNzBmMi02MzZlLTQ2MDctOWQ4MC05NmExODk3YTRmNzAiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjI0MTA0MTksImV4cCI6MTc2MjQxNDAxOX0.1IPcSzGoIjV5BCubLUhbn5-FA7PR5IrLtFVuMOU72OM"

curl -X POST https://api.insurance-optimizer.com/api/pdf-upload/auto \
  -H "Authorization: Bearer $TOKEN" \
  -F "pdf=@/Users/kohki_okumura/Downloads/ソニーdemo.pdf"
