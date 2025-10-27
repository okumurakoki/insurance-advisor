# Insurance API Endpoints

## Overview
This API provides endpoints for managing insurance companies, special accounts, and their performance data.

Base URL: `/api/insurance`

## Endpoints

### 1. Get All Insurance Companies
```
GET /api/insurance/companies
```

**Response:**
```json
[
  {
    "id": 1,
    "company_code": "SONY_LIFE",
    "company_name": "ソニー生命保険株式会社",
    "company_name_en": "Sony Life Insurance Co., Ltd.",
    "is_active": true,
    "created_at": "2025-10-26T21:17:38.573Z",
    "updated_at": "2025-10-26T21:17:38.573Z"
  }
]
```

### 2. Get Insurance Company by ID
```
GET /api/insurance/companies/:id
```

**Parameters:**
- `id` (path): Insurance company ID

**Response:**
```json
{
  "id": 1,
  "company_code": "SONY_LIFE",
  "company_name": "ソニー生命保険株式会社",
  "company_name_en": "Sony Life Insurance Co., Ltd.",
  "is_active": true,
  "created_at": "2025-10-26T21:17:38.573Z",
  "updated_at": "2025-10-26T21:17:38.573Z"
}
```

### 3. Get Special Accounts by Company
```
GET /api/insurance/companies/:id/special-accounts
```

**Parameters:**
- `id` (path): Insurance company ID

**Response:**
```json
[
  {
    "id": 1,
    "company_id": 1,
    "account_code": "SONY_BALANCED_STABLE",
    "account_name": "安定成長バランス型",
    "account_type": "バランス型",
    "investment_policy": null,
    "benchmark": null,
    "base_currency": "JPY",
    "is_active": true,
    "created_at": "2025-10-26T21:17:38.573Z",
    "updated_at": "2025-10-26T21:17:38.573Z",
    "company_code": "SONY_LIFE",
    "company_name": "ソニー生命保険株式会社"
  }
]
```

### 4. Get All Special Accounts
```
GET /api/insurance/special-accounts
```

**Query Parameters:**
- `company_code` (optional): Filter by company code (e.g., "SONY_LIFE", "AXA_LIFE")

**Response:** Same as endpoint #3

### 5. Get Special Account by ID
```
GET /api/insurance/special-accounts/:id
```

**Parameters:**
- `id` (path): Special account ID

**Response:**
```json
{
  "id": 1,
  "company_id": 1,
  "account_code": "SONY_BALANCED_STABLE",
  "account_name": "安定成長バランス型",
  "account_type": "バランス型",
  "investment_policy": null,
  "benchmark": null,
  "base_currency": "JPY",
  "is_active": true,
  "created_at": "2025-10-26T21:17:38.573Z",
  "updated_at": "2025-10-26T21:17:38.573Z",
  "company_code": "SONY_LIFE",
  "company_name": "ソニー生命保険株式会社",
  "company_name_en": "Sony Life Insurance Co., Ltd."
}
```

### 6. Get Performance Data for Special Account
```
GET /api/insurance/special-accounts/:id/performance
```

**Parameters:**
- `id` (path): Special account ID

**Query Parameters:**
- `start_date` (optional): Filter performance data from this date (YYYY-MM-DD)
- `end_date` (optional): Filter performance data until this date (YYYY-MM-DD)
- `limit` (optional): Maximum number of records to return (default: 12)

**Response:**
```json
[
  {
    "id": 1,
    "special_account_id": 1,
    "performance_date": "2025-08-31",
    "unit_price": "249.2300",
    "return_1m": "0.99",
    "return_3m": "4.13",
    "return_6m": "5.11",
    "return_1y": "6.74",
    "return_3y": "33.73",
    "return_since_inception": "149.24",
    "total_assets": null,
    "created_at": "2025-10-26T21:17:38.573Z",
    "account_code": "SONY_BALANCED_STABLE",
    "account_name": "安定成長バランス型",
    "company_code": "SONY_LIFE",
    "company_name": "ソニー生命保険株式会社"
  }
]
```

### 7. Get Latest Performance Data for Special Account
```
GET /api/insurance/special-accounts/:id/performance/latest
```

**Parameters:**
- `id` (path): Special account ID

**Response:**
```json
{
  "id": 1,
  "special_account_id": 1,
  "performance_date": "2025-08-31",
  "unit_price": "249.2300",
  "return_1m": "0.99",
  "return_3m": "4.13",
  "return_6m": "5.11",
  "return_1y": "6.74",
  "return_3y": "33.73",
  "return_since_inception": "149.24",
  "total_assets": null,
  "created_at": "2025-10-26T21:17:38.573Z",
  "account_code": "SONY_BALANCED_STABLE",
  "account_name": "安定成長バランス型",
  "account_type": "バランス型",
  "benchmark": null,
  "company_code": "SONY_LIFE",
  "company_name": "ソニー生命保険株式会社"
}
```

### 8. Get Latest Performance Data for All Special Accounts
```
GET /api/insurance/performance/latest
```

**Query Parameters:**
- `company_code` (optional): Filter by company code (e.g., "SONY_LIFE", "AXA_LIFE")

**Response:** Array of performance records (same structure as endpoint #7)

## Error Responses

All endpoints return standard error responses:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200 OK`: Successful request
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Example Usage

### Get all Sony Life special accounts with latest performance
```bash
# Step 1: Get Sony Life company info
curl http://localhost:3000/api/insurance/companies | jq '.[] | select(.company_code == "SONY_LIFE")'

# Step 2: Get all Sony Life special accounts
curl http://localhost:3000/api/insurance/special-accounts?company_code=SONY_LIFE

# Step 3: Get latest performance for all Sony Life accounts
curl http://localhost:3000/api/insurance/performance/latest?company_code=SONY_LIFE
```

### Get specific account performance history
```bash
# Get performance history for account ID 1, last 12 months
curl 'http://localhost:3000/api/insurance/special-accounts/1/performance?limit=12'
```
