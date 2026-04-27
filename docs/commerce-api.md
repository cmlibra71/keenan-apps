# Commerce REST API Reference

**Base URL:** `https://keenan-group.com.au/api/v1/commerce`

**Version:** 1.0.0

This API provides programmatic access to your commerce data, following patterns established by BigCommerce. All endpoints require API key authentication and return JSON responses.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Request & Response Format](#request--response-format)
3. [Error Handling](#error-handling)
4. [Pagination](#pagination)
5. [Filtering & Sorting](#filtering--sorting)
6. [Rate Limiting](#rate-limiting)
7. **API Reference**
   - [Channels](#channels-api)
   - [Catalog - Categories](#catalog---categories-api)
   - [Catalog - Brands](#catalog---brands-api)
   - [Catalog - Products](#catalog---products-api)
   - [Catalog - Product Categories](#product-category-assignments)
   - [Catalog - Product Channels](#product-channel-assignments)
   - [Catalog - Bulk Pricing](#bulk-pricing-rules)
   - [Catalog - Variants](#catalog---variants-api)
   - [Catalog - Options](#catalog---options-api)
   - [Catalog - Option Values](#product-option-values)
   - [Catalog - Modifiers](#catalog---modifiers-api)
   - [Catalog - Images](#catalog---images-api)
   - [Catalog - Videos](#catalog---videos-api)
   - [Accounts](#accounts-api)
   - [Account Roles](#account-roles-api)
   - [Customers](#customers-api)
   - [Customer Groups](#customer-groups-api)
   - [Carts](#carts-api)
   - [Orders](#orders-api)
   - [Shipments](#shipments-api)
   - [Pricing](#pricing-api)
   - [Promotions](#promotions-api)
   - [Coupons](#coupons-api)
   - [Gift Certificates](#gift-certificates-api)
   - [Shipping](#shipping-api)
   - [Tax](#tax-api)
   - [Inventory](#inventory-api)
   - [Reviews](#reviews-api)
   - [Webhooks](#webhooks-api)
   - [Settings](#settings-api)
   - [Audit Log](#audit-log-api)

---

## Authentication

All API requests require an API key passed in the `X-API-Key` header.

```http
GET /api/v1/commerce/products
X-API-Key: ck_your_api_key_here
```

### API Key Format

- Keys start with `ck_` followed by 64 hexadecimal characters
- Keys are hashed using SHA-256 before storage (never stored in plain text)
- Each key has assigned scopes that control access to resources

### Scopes

| Scope | Resources |
|-------|-----------|
| `read_products` | Products, Variants, Categories, Brands, Images, Videos |
| `write_products` | Products, Variants, Categories, Brands, Images, Videos |
| `read_orders` | Orders, Order Items, Shipments, Transactions, Refunds |
| `write_orders` | Orders, Order Items, Shipments |
| `read_customers` | Customers, Addresses, Groups, Wishlists |
| `write_customers` | Customers, Addresses, Groups, Wishlists |
| `read_accounts` | Accounts, Contacts, Locations, Addresses, Sales Reps, Approval Rules |
| `write_accounts` | Accounts, Contacts, Locations, Addresses, Sales Reps, Approval Rules |
| `read_inventory` | Inventory Locations, Levels |
| `write_inventory` | Inventory Adjustments |
| `read_pricing` | Price Lists, Records, Assignments |
| `write_pricing` | Price Lists, Records, Assignments |
| `read_content` | Channels, Sites, Settings, Webhooks, Shipping, Tax, Audit |
| `write_content` | Channels, Sites, Settings, Webhooks, Shipping, Tax |
| `full_access` | All resources |

---

## Request & Response Format

### Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| `X-API-Key` | Yes | Your API key |
| `Content-Type` | For POST/PUT | Must be `application/json` |
| `Accept` | No | Defaults to `application/json` |

### Response Format

All successful responses follow this structure:

```json
{
  "data": { ... },
  "meta": {
    "pagination": {
      "total": 100,
      "count": 25,
      "per_page": 25,
      "current_page": 1,
      "total_pages": 4,
      "links": {
        "next": "/api/v1/commerce/products?page=2",
        "previous": null
      }
    }
  }
}
```

For single resource responses:

```json
{
  "data": {
    "id": 1,
    "name": "Product Name",
    ...
  }
}
```

---

## Error Handling

### Error Response Format

All errors return a consistent structure with full disclosure of what went wrong:

```json
{
  "status": 422,
  "title": "Validation Error",
  "detail": "The product could not be created due to validation failures.",
  "errors": {
    "sku": "SKU 'ABC123' already exists. SKUs must be unique across all products.",
    "price": "Price must be a positive number. Received: -10.00",
    "brand_id": "Brand with ID 999 does not exist. Use GET /api/v1/commerce/catalog/brands to list valid brands."
  },
  "request_id": "req_abc123def456",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | `BAD_REQUEST` | Malformed request syntax |
| 401 | `UNAUTHORIZED` | Missing or invalid API key |
| 403 | `FORBIDDEN` | Valid key but insufficient permissions |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `CONFLICT` | Resource conflict (duplicate, in-use) |
| 422 | `UNPROCESSABLE_ENTITY` | Validation failed |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |

### Example Error Responses

**401 Unauthorized:**
```json
{
  "status": 401,
  "title": "Unauthorized",
  "detail": "API key 'ck_abc...' is invalid or has been revoked.",
  "request_id": "req_xyz789",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**403 Forbidden:**
```json
{
  "status": 403,
  "title": "Forbidden",
  "detail": "API key has scope 'read_products' but this endpoint requires 'write_products'.",
  "request_id": "req_xyz789",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**404 Not Found:**
```json
{
  "status": 404,
  "title": "Not Found",
  "detail": "Product with ID 12345 does not exist.",
  "request_id": "req_xyz789",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**409 Conflict:**
```json
{
  "status": 409,
  "title": "Conflict",
  "detail": "Cannot delete category 'Electronics' (ID: 5) because it contains 12 products. Move or delete products first.",
  "request_id": "req_xyz789",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Pagination

List endpoints support pagination with these query parameters:

| Parameter | Default | Max | Description |
|-----------|---------|-----|-------------|
| `page` | 1 | - | Page number |
| `limit` | 25 | 250 | Items per page |

### Example

```http
GET /api/v1/commerce/products?page=2&limit=50
```

### Response Metadata

```json
{
  "data": [...],
  "meta": {
    "pagination": {
      "total": 500,
      "count": 50,
      "per_page": 50,
      "current_page": 2,
      "total_pages": 10,
      "links": {
        "next": "/api/v1/commerce/products?page=3&limit=50",
        "previous": "/api/v1/commerce/products?page=1&limit=50"
      }
    }
  }
}
```

---

## Filtering & Sorting

### Filtering

Most list endpoints support filtering via query parameters:

```http
GET /api/v1/commerce/products?brand_id=5&is_visible=true&price:min=10&price:max=100
```

**Filter Operators:**
- `field=value` - Exact match
- `field:min=value` - Greater than or equal
- `field:max=value` - Less than or equal
- `field:in=1,2,3` - In list
- `field:like=term` - Contains (case-insensitive)

### Sorting

```http
GET /api/v1/commerce/products?sort=price&direction=desc
```

| Parameter | Values | Default |
|-----------|--------|---------|
| `sort` | Field name | `id` |
| `direction` | `asc`, `desc` | `asc` |

### Including Related Resources

Some endpoints support including related resources:

```http
GET /api/v1/commerce/products/123?include=variants,images,categories
```

---

## Rate Limiting

- **Limit:** 150 requests per minute per API key
- **Headers returned:**
  - `X-Rate-Limit-Limit`: Max requests per window
  - `X-Rate-Limit-Remaining`: Remaining requests
  - `X-Rate-Limit-Reset`: Unix timestamp when limit resets

**429 Response:**
```json
{
  "status": 429,
  "title": "Rate Limited",
  "detail": "Rate limit exceeded: 150/150 requests per minute. Retry after 45 seconds.",
  "retry_after": 45,
  "request_id": "req_xyz789",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

# API Reference

---

## Channels API

Channels represent sales channels (storefronts, marketplaces, POS, etc.).

**Base Path:** `/api/v1/commerce/channels`

**Required Scopes:** `read_content`, `write_content`

### List Channels

```http
GET /channels
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status: `active`, `inactive`, `archived` |
| `type` | string | Filter by type: `storefront`, `marketplace`, `pos`, `marketing` |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Primary Storefront",
      "type": "storefront",
      "platform": "custom",
      "status": "active",
      "is_default": true,
      "default_currency_code": "USD",
      "default_locale": "en-US",
      "config_meta": {},
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": { "pagination": { ... } }
}
```

### Get Channel

```http
GET /channels/{channel_id}
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Primary Storefront",
    "type": "storefront",
    "platform": "custom",
    "status": "active",
    "is_default": true,
    "default_currency_code": "USD",
    "default_locale": "en-US",
    "config_meta": {},
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### Create Channel

```http
POST /channels
```

**Request Body:**
```json
{
  "name": "European Storefront",
  "type": "storefront",
  "platform": "custom",
  "default_currency_code": "EUR",
  "default_locale": "en-GB",
  "config_meta": {
    "timezone": "Europe/London"
  }
}
```

**Required Fields:** `name`

**Response:** `201 Created`
```json
{
  "data": {
    "id": 2,
    "uuid": "...",
    "name": "European Storefront",
    ...
  }
}
```

### Update Channel

```http
PUT /channels/{channel_id}
```

**Request Body:**
```json
{
  "name": "EU Storefront",
  "status": "active"
}
```

**Response:** `200 OK`

### Delete Channel

```http
DELETE /channels/{channel_id}
```

**Response:** `204 No Content`

**Error (if channel has associated data):**
```json
{
  "status": 409,
  "title": "Conflict",
  "detail": "Cannot delete channel 'Primary Storefront' (ID: 1) because it has 50 products assigned. Reassign or remove products first."
}
```

---

### Channel Sites

Sites are URLs/domains associated with a channel.

#### List Channel Sites

```http
GET /channels/{channel_id}/sites
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "channel_id": 1,
      "url": "https://store.example.com",
      "is_primary": true,
      "ssl_enabled": true,
      "site_name": "Example Store",
      "meta_title": "Example Store - Quality Products",
      "meta_description": "Shop quality products...",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Get Channel Site

```http
GET /channels/{channel_id}/sites/{site_id}
```

#### Create Channel Site

```http
POST /channels/{channel_id}/sites
```

**Request Body:**
```json
{
  "url": "https://shop.example.com",
  "is_primary": false,
  "site_name": "Secondary Site",
  "meta_title": "Shop at Example",
  "meta_description": "Find great deals..."
}
```

#### Update Channel Site

```http
PUT /channels/{channel_id}/sites/{site_id}
```

#### Delete Channel Site

```http
DELETE /channels/{channel_id}/sites/{site_id}
```

---

### Channel Settings

Key-value settings specific to a channel.

#### List Channel Settings

```http
GET /channels/{channel_id}/settings
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "channel_id": 1,
      "setting_key": "checkout_flow",
      "setting_value": { "type": "single_page", "guest_checkout": true },
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Get Channel Setting

```http
GET /channels/{channel_id}/settings/{setting_key}
```

#### Upsert Channel Setting

```http
PUT /channels/{channel_id}/settings/{setting_key}
```

**Request Body:**
```json
{
  "setting_value": { "type": "multi_page", "guest_checkout": false }
}
```

#### Delete Channel Setting

```http
DELETE /channels/{channel_id}/settings/{setting_key}
```

---

## Catalog - Categories API

Categories organize products into a hierarchical structure within category trees.

**Base Path:** `/api/v1/commerce/catalog`

**Required Scopes:** `read_products`, `write_products`

### Category Trees

#### List Category Trees

```http
GET /catalog/category-trees
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `channel_id` | integer | Filter by channel |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "name": "Primary Categories",
      "channel_id": 1,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Get Category Tree

```http
GET /catalog/category-trees/{tree_id}
```

#### Create Category Tree

```http
POST /catalog/category-trees
```

**Request Body:**
```json
{
  "name": "Holiday Categories",
  "channel_id": 1
}
```

#### Update Category Tree

```http
PUT /catalog/category-trees/{tree_id}
```

#### Delete Category Tree

```http
DELETE /catalog/category-trees/{tree_id}
```

**Error (if tree has categories):**
```json
{
  "status": 409,
  "title": "Conflict",
  "detail": "Cannot delete category tree 'Primary Categories' (ID: 1) because it contains 25 categories. Delete categories first."
}
```

---

### Categories

#### List Categories

```http
GET /catalog/categories
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `tree_id` | integer | Filter by category tree (required) |
| `parent_id` | integer | Filter by parent category |
| `is_active` | boolean | Filter by active status |
| `include_in_menu` | boolean | Filter by menu inclusion |
| `include_in_search` | boolean | Filter by search inclusion |
| `include_in_filters` | boolean | Filter by filter inclusion |
| `name:like` | string | Search by name |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "tree_id": 1,
      "parent_id": null,
      "name": "Electronics",
      "slug": "electronics",
      "description": "Electronic devices and accessories",
      "path_ids": [1],
      "path_names": ["Electronics"],
      "depth": 0,
      "sort_order": 0,
      "is_active": true,
      "include_in_menu": true,
      "include_in_search": true,
      "include_in_filters": true,
      "include_products": "products",
      "page_title": "Electronics - Shop Now",
      "meta_description": "Browse our electronics collection",
      "meta_keywords": "electronics, devices, gadgets",
      "image_url": "https://cdn.example.com/categories/electronics.jpg",
      "metafields": {},
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Get Category

```http
GET /catalog/categories/{category_id}
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `include` | string | Include related data: `children`, `products` |

#### Create Category

```http
POST /catalog/categories
```

**Request Body:**
```json
{
  "tree_id": 1,
  "parent_id": null,
  "name": "Smartphones",
  "slug": "smartphones",
  "description": "Latest smartphones and accessories",
  "is_active": true,
  "sort_order": 1,
  "page_title": "Smartphones - Best Deals",
  "meta_description": "Shop the latest smartphones",
  "image_url": "https://cdn.example.com/categories/smartphones.jpg"
}
```

**Required Fields:** `tree_id`, `name`, `slug`

**Validation Errors:**
```json
{
  "status": 422,
  "title": "Validation Error",
  "errors": {
    "tree_id": "Category tree with ID 999 does not exist.",
    "slug": "Slug 'electronics' already exists in this tree. Slugs must be unique within a category tree.",
    "parent_id": "Parent category ID 50 does not exist in tree ID 1."
  }
}
```

#### Update Category

```http
PUT /catalog/categories/{category_id}
```

#### Delete Category

```http
DELETE /catalog/categories/{category_id}
```

**Error (if has children):**
```json
{
  "status": 409,
  "title": "Conflict",
  "detail": "Cannot delete category 'Electronics' (ID: 1) because it has 5 child categories. Delete or move children first."
}
```

---

## Catalog - Brands API

**Base Path:** `/api/v1/commerce/catalog/brands`

**Required Scopes:** `read_products`, `write_products`

### List Brands

```http
GET /catalog/brands
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `name:like` | string | Search by name |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "name": "Apple",
      "slug": "apple",
      "page_title": "Apple Products",
      "meta_description": "Shop Apple products",
      "meta_keywords": "apple, iphone, macbook",
      "search_keywords": "apple mac iphone ipad",
      "image_url": "https://cdn.example.com/brands/apple.png",
      "metafields": {},
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Get Brand

```http
GET /catalog/brands/{brand_id}
```

### Create Brand

```http
POST /catalog/brands
```

**Request Body:**
```json
{
  "name": "Samsung",
  "slug": "samsung",
  "page_title": "Samsung Products",
  "meta_description": "Official Samsung products",
  "image_url": "https://cdn.example.com/brands/samsung.png"
}
```

**Required Fields:** `name`, `slug`

### Update Brand

```http
PUT /catalog/brands/{brand_id}
```

### Delete Brand

```http
DELETE /catalog/brands/{brand_id}
```

**Note:** Deleting a brand sets `brand_id` to `null` on associated products.

---

## Catalog - Products API

**Base Path:** `/api/v1/commerce/catalog/products`

**Required Scopes:** `read_products`, `write_products`

### List Products

```http
GET /catalog/products
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `sku` | string | Filter by exact SKU |
| `sku:in` | string | Filter by multiple SKUs (comma-separated) |
| `name:like` | string | Search by name |
| `brand_id` | integer | Filter by brand |
| `type` | string | Filter by type: `physical`, `digital`, `giftcard` |
| `is_visible` | boolean | Filter by visibility |
| `is_featured` | boolean | Filter by featured status |
| `price:min` | decimal | Minimum price |
| `price:max` | decimal | Maximum price |
| `inventory_level:min` | integer | Minimum inventory |
| `inventory_level:max` | integer | Maximum inventory |
| `date_modified:min` | datetime | Modified after date |
| `date_modified:max` | datetime | Modified before date |
| `include` | string | Include: `variants`, `images`, `options`, `modifiers`, `categories` |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "name": "iPhone 15 Pro",
      "sku": "IPHONE15PRO",
      "type": "physical",
      "description": "The latest iPhone with advanced features...",
      "description_short": "Latest iPhone model",
      "price": "999.0000",
      "cost_price": "700.0000",
      "retail_price": "1099.0000",
      "sale_price": null,
      "tax_class_id": 1,
      "is_tax_exempt": false,
      "weight": "0.2060",
      "width": "7.0800",
      "height": "14.6800",
      "depth": "0.8300",
      "inventory_level": 150,
      "inventory_warning_level": 20,
      "inventory_tracking": "variant",
      "brand_id": 1,
      "is_visible": true,
      "is_featured": true,
      "availability": "available",
      "availability_description": null,
      "preorder_release_date": null,
      "preorder_message": null,
      "condition": "new",
      "page_title": "iPhone 15 Pro - Buy Now",
      "meta_description": "Buy the new iPhone 15 Pro",
      "meta_keywords": "iphone, apple, smartphone",
      "search_keywords": "iphone 15 pro apple smartphone",
      "url_path": "/products/iphone-15-pro",
      "min_purchase_quantity": 1,
      "max_purchase_quantity": 5,
      "gift_wrapping_allowed": true,
      "related_product_ids": [2, 3, 4],
      "warranty": "1 year manufacturer warranty",
      "custom_fields": {
        "release_year": "2024"
      },
      "metafields": {},
      "date_created": "2024-01-01T00:00:00Z",
      "date_modified": "2024-01-15T10:30:00Z",
      "date_last_imported": null,
      "is_deleted": false,
      "deleted_at": null
    }
  ],
  "meta": { "pagination": { ... } }
}
```

### Get Product

```http
GET /catalog/products/{product_id}
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `include` | string | Include: `variants`, `images`, `videos`, `options`, `modifiers`, `categories`, `bulk_pricing` |

### Create Product

```http
POST /catalog/products
```

**Request Body:**
```json
{
  "name": "MacBook Pro 16\"",
  "sku": "MBP16-2024",
  "type": "physical",
  "description": "Powerful laptop for professionals",
  "price": "2499.00",
  "cost_price": "1800.00",
  "weight": "2.1400",
  "brand_id": 1,
  "is_visible": true,
  "is_featured": false,
  "inventory_tracking": "product",
  "inventory_level": 50,
  "inventory_warning_level": 10,
  "categories": [1, 5],
  "custom_fields": {
    "processor": "M3 Pro",
    "ram": "18GB"
  }
}
```

**Required Fields:** `name`, `price`

**Validation Errors:**
```json
{
  "status": 422,
  "title": "Validation Error",
  "errors": {
    "sku": "SKU 'MBP16-2024' already exists. SKUs must be unique.",
    "price": "Price must be a non-negative number. Received: -100",
    "brand_id": "Brand with ID 999 does not exist.",
    "type": "Invalid product type 'service'. Valid types: physical, digital, giftcard"
  }
}
```

### Update Product

```http
PUT /catalog/products/{product_id}
```

**Request Body:**
```json
{
  "price": "2299.00",
  "sale_price": "2199.00",
  "is_featured": true
}
```

### Delete Product

```http
DELETE /catalog/products/{product_id}
```

**Note:** Products are soft-deleted by default. Use `?permanent=true` for permanent deletion.

### Batch Update Products

```http
PUT /catalog/products
```

**Scope:** `write_products`

Accepts an array of product objects, each with an `id` field and fields to update.

**Request Body:**
```json
[
  { "id": 1, "price": "29.99", "is_visible": true },
  { "id": 2, "name": "Updated Name" }
]
```

**Response:**
```json
{
  "data": {
    "updated": 2,
    "errors": []
  }
}
```

### Batch Delete Products

```http
DELETE /catalog/products?id:in=1,2,3
```

**Scope:** `write_products`

Delete multiple products by ID using the `id:in` query parameter.

---

### Product Category Assignments

#### List Product Categories

```http
GET /catalog/products/{product_id}/categories
```

**Scope:** `read_products`

Returns all category assignments for a product.

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "product_id": 42,
      "category_id": 5,
      "category_name": "Electronics",
      "sort_order": 0,
      "is_primary": false
    }
  ]
}
```

#### Assign Product to Category

```http
POST /catalog/products/{product_id}/categories
```

**Scope:** `write_products`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `category_id` | integer | Yes | Category to assign |
| `sort_order` | integer | No | Sort order within category |
| `is_primary` | boolean | No | Whether this is the primary category |

#### Remove Product from Category

```http
DELETE /catalog/products/{product_id}/categories/{category_id}
```

**Scope:** `write_products`

---

### Product Channel Assignments

#### List Product Channel Assignments

```http
GET /catalog/products/{product_id}/channel-assignments
```

**Scope:** `read_products`

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "product_id": 1,
      "channel_id": 1,
      "is_visible": true,
      "is_featured": false,
      "date_assigned": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Assign Product to Channel

```http
POST /catalog/products/{product_id}/channel-assignments
```

**Scope:** `write_products`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `channel_id` | integer | Yes | Channel to assign |
| `is_visible` | boolean | No | Visibility in channel (default: true) |
| `is_featured` | boolean | No | Featured in channel (default: false) |

#### Update Channel Assignment

```http
PUT /catalog/products/{product_id}/channel-assignments/{channel_id}
```

**Scope:** `write_products`

#### Remove Product from Channel

```http
DELETE /catalog/products/{product_id}/channel-assignments/{channel_id}
```

**Scope:** `write_products`

---

### Bulk Pricing Rules

#### List Bulk Pricing Rules

```http
GET /catalog/products/{product_id}/bulk-pricing
```

**Scope:** `read_products`

**Filters:** `type`

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "product_id": 1,
      "quantity_min": 10,
      "quantity_max": 24,
      "type": "percent",
      "amount": "5.0000"
    },
    {
      "id": 2,
      "product_id": 1,
      "quantity_min": 25,
      "quantity_max": null,
      "type": "percent",
      "amount": "10.0000"
    }
  ]
}
```

#### Get Bulk Pricing Rule

```http
GET /catalog/products/{product_id}/bulk-pricing/{rule_id}
```

**Scope:** `read_products`

#### Create Bulk Pricing Rule

```http
POST /catalog/products/{product_id}/bulk-pricing
```

**Scope:** `write_products`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `quantity_min` | integer | Yes | Minimum quantity |
| `quantity_max` | integer | No | Maximum quantity |
| `type` | string | Yes | `price`, `percent`, or `fixed` |
| `amount` | decimal | Yes | Discount amount |

#### Update Bulk Pricing Rule

```http
PUT /catalog/products/{product_id}/bulk-pricing/{rule_id}
```

**Scope:** `write_products`

#### Delete Bulk Pricing Rule

```http
DELETE /catalog/products/{product_id}/bulk-pricing/{rule_id}
```

**Scope:** `write_products`

---

## Catalog - Variants API

Variants represent purchasable versions of a product (e.g., different sizes/colors).

**Base Path:** `/api/v1/commerce/catalog/products/{product_id}/variants`

**Required Scopes:** `read_products`, `write_products`

### List Variants

```http
GET /catalog/products/{product_id}/variants
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "product_id": 1,
      "sku": "IPHONE15PRO-256-BLACK",
      "sku_id": null,
      "price": "999.0000",
      "cost_price": "700.0000",
      "sale_price": null,
      "retail_price": "1099.0000",
      "weight": "0.2060",
      "width": "7.0800",
      "height": "14.6800",
      "depth": "0.8300",
      "inventory_level": 50,
      "inventory_warning_level": 10,
      "upc": "194253394815",
      "ean": null,
      "gtin": "00194253394815",
      "mpn": "MTUX3LL/A",
      "bin_picking_number": "A-15-B",
      "purchasing_disabled": false,
      "purchasing_disabled_message": null,
      "image_url": "https://cdn.example.com/variants/iphone-black.jpg",
      "option_display_name": "256GB / Black Titanium",
      "metafields": {},
      "sort_order": 0,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "option_values": [
        { "option_id": 1, "option_name": "Storage", "value_id": 1, "label": "256GB" },
        { "option_id": 2, "option_name": "Color", "value_id": 4, "label": "Black Titanium" }
      ]
    }
  ]
}
```

### Get Variant

```http
GET /catalog/products/{product_id}/variants/{variant_id}
```

### Create Variant

```http
POST /catalog/products/{product_id}/variants
```

**Request Body:**
```json
{
  "sku": "IPHONE15PRO-512-SILVER",
  "price": "1199.00",
  "cost_price": "850.00",
  "inventory_level": 25,
  "option_values": [
    { "option_id": 1, "option_value_id": 2 },
    { "option_id": 2, "option_value_id": 5 }
  ],
  "upc": "194253394822",
  "image_url": "https://cdn.example.com/variants/iphone-silver.jpg"
}
```

### Update Variant

```http
PUT /catalog/products/{product_id}/variants/{variant_id}
```

### Delete Variant

```http
DELETE /catalog/products/{product_id}/variants/{variant_id}
```

---

## Catalog - Options API

Options define variant-creating attributes (Size, Color, etc.).

**Base Path:** `/api/v1/commerce/catalog/products/{product_id}/options`

**Required Scopes:** `read_products`, `write_products`

### List Product Options

```http
GET /catalog/products/{product_id}/options
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "product_id": 1,
      "name": "storage",
      "display_name": "Storage Capacity",
      "type": "dropdown",
      "sort_order": 0,
      "is_required": true,
      "config": {},
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "option_values": [
        { "id": 1, "label": "256GB", "sort_order": 0, "is_default": true },
        { "id": 2, "label": "512GB", "sort_order": 1, "is_default": false },
        { "id": 3, "label": "1TB", "sort_order": 2, "is_default": false }
      ]
    }
  ]
}
```

### Get Option

```http
GET /catalog/products/{product_id}/options/{option_id}
```

### Create Option

```http
POST /catalog/products/{product_id}/options
```

**Request Body:**
```json
{
  "name": "color",
  "display_name": "Color",
  "type": "swatch",
  "is_required": true,
  "option_values": [
    { "label": "Black Titanium", "value_data": { "color": "#1C1C1E" }, "sort_order": 0 },
    { "label": "White Titanium", "value_data": { "color": "#F5F5F7" }, "sort_order": 1 },
    { "label": "Blue Titanium", "value_data": { "color": "#4A6B8A" }, "sort_order": 2 }
  ]
}
```

**Option Types:** `dropdown`, `radio`, `rectangle`, `swatch`, `text`, `checkbox`

### Update Option

```http
PUT /catalog/products/{product_id}/options/{option_id}
```

### Delete Option

```http
DELETE /catalog/products/{product_id}/options/{option_id}
```

**Warning:** Deleting an option also deletes associated variants.

---

### Product Option Values

#### Create Option Value

```http
POST /catalog/products/{product_id}/options/{option_id}/values
```

**Scope:** `write_products`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | string | Yes | Display label |
| `value_data` | object | No | Additional value data |
| `sort_order` | integer | No | Sort order |
| `is_default` | boolean | No | Whether this is the default value |

**Request Body:**
```json
{
  "label": "Natural Titanium",
  "value_data": { "color": "#8F8F8F" },
  "sort_order": 3
}
```

#### Update Option Value

```http
PUT /catalog/products/{product_id}/options/{option_id}/values/{value_id}
```

**Scope:** `write_products`

#### Delete Option Value

```http
DELETE /catalog/products/{product_id}/options/{option_id}/values/{value_id}
```

**Scope:** `write_products`

---

## Catalog - Modifiers API

Modifiers are non-SKU options that may adjust price/weight (text fields, checkboxes, etc.).

**Base Path:** `/api/v1/commerce/catalog/products/{product_id}/modifiers`

**Required Scopes:** `read_products`, `write_products`

### List Product Modifiers

```http
GET /catalog/products/{product_id}/modifiers
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "product_id": 1,
      "name": "engraving",
      "display_name": "Custom Engraving",
      "type": "text",
      "is_required": false,
      "sort_order": 0,
      "config": {
        "max_length": 50,
        "placeholder": "Enter text to engrave"
      },
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Get Product Modifier

```http
GET /catalog/products/{product_id}/modifiers/{modifier_id}
```

**Scope:** `read_products`

### Create Modifier

```http
POST /catalog/products/{product_id}/modifiers
```

**Request Body:**
```json
{
  "name": "gift_wrap",
  "display_name": "Gift Wrapping",
  "type": "checkbox",
  "is_required": false,
  "modifier_values": [
    {
      "label": "Add gift wrapping (+$5.00)",
      "price_adjuster": "relative",
      "price_adjuster_value": "5.00",
      "is_default": false
    }
  ]
}
```

**Modifier Types:** `text`, `textarea`, `date`, `checkbox`, `file`, `numbers_only_text`

### Update Modifier

```http
PUT /catalog/products/{product_id}/modifiers/{modifier_id}
```

### Delete Modifier

```http
DELETE /catalog/products/{product_id}/modifiers/{modifier_id}
```

---

## Catalog - Images API

**Base Path:** `/api/v1/commerce/catalog/products/{product_id}/images`

**Required Scopes:** `read_products`, `write_products`

### List Product Images

```http
GET /catalog/products/{product_id}/images
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "product_id": 1,
      "url_standard": "https://cdn.example.com/products/iphone-1.jpg",
      "url_thumbnail": "https://cdn.example.com/products/iphone-1-thumb.jpg",
      "url_tiny": "https://cdn.example.com/products/iphone-1-tiny.jpg",
      "url_zoom": "https://cdn.example.com/products/iphone-1-zoom.jpg",
      "description": "iPhone 15 Pro front view",
      "alt_text": "iPhone 15 Pro in Black Titanium",
      "is_thumbnail": true,
      "sort_order": 0,
      "variant_id": null,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Get Product Image

```http
GET /catalog/products/{product_id}/images/{image_id}
```

**Scope:** `read_products`

### Create Product Image

```http
POST /catalog/products/{product_id}/images
```

**Request Body:**
```json
{
  "url_standard": "https://cdn.example.com/products/iphone-2.jpg",
  "url_thumbnail": "https://cdn.example.com/products/iphone-2-thumb.jpg",
  "alt_text": "iPhone 15 Pro side view",
  "description": "Side profile showing buttons",
  "is_thumbnail": false,
  "sort_order": 1
}
```

### Update Product Image

```http
PUT /catalog/products/{product_id}/images/{image_id}
```

### Delete Product Image

```http
DELETE /catalog/products/{product_id}/images/{image_id}
```

---

## Catalog - Videos API

**Base Path:** `/api/v1/commerce/catalog/products/{product_id}/videos`

**Required Scopes:** `read_products`, `write_products`

### List Product Videos

```http
GET /catalog/products/{product_id}/videos
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "product_id": 1,
      "title": "iPhone 15 Pro - Unboxing",
      "description": "Watch our detailed unboxing video",
      "type": "youtube",
      "video_id": "dQw4w9WgXcQ",
      "sort_order": 0,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Get Product Video

```http
GET /catalog/products/{product_id}/videos/{video_id}
```

**Scope:** `read_products`

### Create Product Video

```http
POST /catalog/products/{product_id}/videos
```

**Request Body:**
```json
{
  "title": "Product Demo",
  "description": "See the product in action",
  "type": "youtube",
  "video_id": "abc123xyz",
  "sort_order": 0
}
```

**Video Types:** `youtube`, `vimeo`

### Update Product Video

```http
PUT /catalog/products/{product_id}/videos/{video_id}
```

### Delete Product Video

```http
DELETE /catalog/products/{product_id}/videos/{video_id}
```

---

## Catalog - Attachments API

**Base Path:** `/api/v1/commerce/catalog/products/{product_id}/attachments`

**Required Scopes:** `read_products`, `write_products`

### List Product Attachments

```http
GET /catalog/products/{product_id}/attachments
```

**Query Parameters:** `?file_type=pdf`, `?label=Spec Sheet`

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "product_id": 1,
      "file_name": "MOF-RNB8603G-CD.pdf",
      "url": "https://keenan-group-images.s3.ap-southeast-2.amazonaws.com/attachments/123/MOF-RNB8603G-CD.pdf",
      "label": "Product Spec Sheet",
      "file_type": "pdf",
      "file_size": 245760,
      "sort_order": 0,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Get Product Attachment

```http
GET /catalog/products/{product_id}/attachments/{attachment_id}
```

**Scope:** `read_products`

### Create Product Attachment

```http
POST /catalog/products/{product_id}/attachments
```

**Request Body:**
```json
{
  "url": "https://keenan-group-images.s3.ap-southeast-2.amazonaws.com/attachments/123/spec.pdf",
  "file_name": "spec.pdf",
  "label": "Product Spec Sheet",
  "file_type": "pdf",
  "file_size": 245760,
  "sort_order": 0
}
```

### Update Product Attachment

```http
PUT /catalog/products/{product_id}/attachments/{attachment_id}
```

### Delete Product Attachment

```http
DELETE /catalog/products/{product_id}/attachments/{attachment_id}
```

### Batch Create Attachments

```http
POST /catalog/products/{product_id}/attachments/batch
```

**Request Body:**
```json
{
  "attachments": [
    { "url": "...", "file_name": "spec1.pdf", "file_type": "pdf", "sort_order": 0 },
    { "url": "...", "file_name": "manual.pdf", "file_type": "pdf", "sort_order": 1 }
  ]
}
```

Max 250 items per request.

### Batch Update Attachments

```http
PUT /catalog/products/{product_id}/attachments/batch
```

**Request Body:**
```json
{
  "attachments": [
    { "id": 1, "label": "Updated Label" },
    { "id": 2, "sort_order": 5 }
  ]
}
```

---

## Accounts API

B2B customer accounts with contacts, locations, addresses, sales reps, and approval rules.

**Base Path:** `/api/v1/commerce/accounts`

**Required Scopes:** `read_accounts`, `write_accounts`

### List Accounts

```http
GET /accounts
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Filter by name |
| `name:like` | string | Search by name |
| `status` | string | Filter by status: `active`, `inactive`, `suspended` |
| `customer_group_id` | integer | Filter by customer group |
| `origin_channel_id` | integer | Filter by origin channel |
| `industry` | string | Filter by industry |
| `include` | string | Include: `contacts`, `locations`, `addresses`, `sales_reps` |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "name": "Acme Corporation",
      "legal_name": "Acme Corp LLC",
      "tax_id": "12-3456789",
      "customer_group_id": 2,
      "origin_channel_id": 1,
      "status": "active",
      "tax_exempt_category": null,
      "store_credit": "500.0000",
      "accepts_marketing": true,
      "phone": "+1-555-123-4567",
      "website": "https://acme.com",
      "industry": "Manufacturing",
      "notes": "Key account",
      "attributes": {},
      "metafields": {},
      "net_terms_days": 30,
      "credit_limit": "50000.0000",
      "current_balance": "12500.0000",
      "past_due_amount": "0.0000",
      "past_due_action": "warn",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": { "pagination": { ... } }
}
```

### Get Account

```http
GET /accounts/{account_id}
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `include` | string | Include: `contacts`, `locations`, `addresses`, `sales_reps`, `approval_rules` |

### Create Account

```http
POST /accounts
```

**Request Body:**
```json
{
  "name": "Acme Corporation",
  "legal_name": "Acme Corp LLC",
  "tax_id": "12-3456789",
  "customer_group_id": 2,
  "origin_channel_id": 1,
  "phone": "+1-555-123-4567",
  "website": "https://acme.com",
  "industry": "Manufacturing",
  "net_terms_days": 30,
  "credit_limit": "50000.00",
  "past_due_action": "warn"
}
```

**Required Fields:** `name`

### Update Account

```http
PUT /accounts/{account_id}
```

### Delete Account

```http
DELETE /accounts/{account_id}
```

---

### Account Contacts

#### List Account Contacts

```http
GET /accounts/{account_id}/contacts
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "account_id": 1,
      "email": "john@acme.com",
      "first_name": "John",
      "last_name": "Doe",
      "phone": "+1-555-123-4567",
      "job_title": "Purchasing Manager",
      "role_id": 2,
      "is_primary": true,
      "is_active": true,
      "accepts_marketing": true,
      "form_fields": {},
      "attributes": {},
      "metafields": {},
      "date_created": "2024-01-01T00:00:00Z",
      "date_modified": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Get Account Contact

```http
GET /accounts/{account_id}/contacts/{contact_id}
```

#### Create Account Contact

```http
POST /accounts/{account_id}/contacts
```

**Request Body:**
```json
{
  "email": "jane@acme.com",
  "password": "securepassword123",
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+1-555-987-6543",
  "job_title": "Buyer",
  "role_id": 3,
  "is_primary": false,
  "accepts_marketing": true
}
```

**Required Fields:** `email`

#### Update Account Contact

```http
PUT /accounts/{account_id}/contacts/{contact_id}
```

#### Delete Account Contact

```http
DELETE /accounts/{account_id}/contacts/{contact_id}
```

---

#### Contact Location Assignments

##### List Contact Locations

```http
GET /accounts/{account_id}/contacts/{contact_id}/locations
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "contact_id": 1,
      "location_id": 1,
      "is_default": true,
      "created_at": "2024-01-01T00:00:00Z",
      "location": {
        "id": 1,
        "name": "Main Warehouse",
        "code": "MAIN"
      }
    }
  ]
}
```

##### Assign Contact to Location

```http
POST /accounts/{account_id}/contacts/{contact_id}/locations
```

**Request Body:**
```json
{
  "location_id": 1,
  "is_default": true
}
```

##### Remove Contact from Location

```http
DELETE /accounts/{account_id}/contacts/{contact_id}/locations
```

**Request Body:**
```json
{
  "location_id": 1
}
```

---

### Account Locations

#### List Account Locations

```http
GET /accounts/{account_id}/locations
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "account_id": 1,
      "name": "Main Warehouse",
      "code": "MAIN",
      "is_default": true,
      "is_active": true,
      "allowed_shipping_method_ids": [],
      "allowed_payment_methods": [],
      "address1": "100 Industrial Way",
      "city": "Dallas",
      "state_or_province": "Texas",
      "state_or_province_code": "TX",
      "postal_code": "75001",
      "country": "United States",
      "country_code": "US",
      "phone": "+1-555-100-2000",
      "metafields": {},
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Get Account Location

```http
GET /accounts/{account_id}/locations/{location_id}
```

#### Create Account Location

```http
POST /accounts/{account_id}/locations
```

**Request Body:**
```json
{
  "name": "East Coast Office",
  "code": "EAST",
  "address1": "500 Commerce Dr",
  "city": "Newark",
  "state_or_province": "New Jersey",
  "state_or_province_code": "NJ",
  "postal_code": "07102",
  "country": "United States",
  "country_code": "US"
}
```

**Required Fields:** `name`

#### Update Account Location

```http
PUT /accounts/{account_id}/locations/{location_id}
```

#### Delete Account Location

```http
DELETE /accounts/{account_id}/locations/{location_id}
```

---

### Account Addresses

#### List Account Addresses

```http
GET /accounts/{account_id}/addresses
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "account_id": 1,
      "location_id": 1,
      "label": "HQ Billing",
      "first_name": "John",
      "last_name": "Doe",
      "company": "Acme Corp",
      "address1": "123 Main Street",
      "address2": "Suite 100",
      "city": "San Francisco",
      "state_or_province": "California",
      "state_or_province_code": "CA",
      "postal_code": "94102",
      "country": "United States",
      "country_code": "US",
      "phone": "+1-555-123-4567",
      "address_type": "shipping",
      "is_default_billing": false,
      "is_default_shipping": true,
      "form_fields": {},
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Get Account Address

```http
GET /accounts/{account_id}/addresses/{address_id}
```

#### Create Account Address

```http
POST /accounts/{account_id}/addresses
```

**Request Body:**
```json
{
  "label": "Warehouse Shipping",
  "address1": "456 Oak Avenue",
  "city": "Los Angeles",
  "state_or_province": "California",
  "state_or_province_code": "CA",
  "postal_code": "90001",
  "country": "United States",
  "country_code": "US",
  "address_type": "shipping",
  "is_default_shipping": true
}
```

**Required Fields:** `address1`, `city`, `country`

#### Update Account Address

```http
PUT /accounts/{account_id}/addresses/{address_id}
```

#### Delete Account Address

```http
DELETE /accounts/{account_id}/addresses/{address_id}
```

---

### Account Sales Reps

#### List Account Sales Reps

```http
GET /accounts/{account_id}/sales-reps
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "account_id": 1,
      "sales_rep_id": 1,
      "is_primary": true,
      "commission_rate_override": null,
      "notes": null,
      "assigned_at": "2024-01-01T00:00:00Z",
      "sales_rep": {
        "id": 1,
        "email": "rep@company.com",
        "first_name": "Sales",
        "last_name": "Rep",
        "territory": "West Coast"
      }
    }
  ]
}
```

#### Assign Sales Rep to Account

```http
POST /accounts/{account_id}/sales-reps
```

**Request Body:**
```json
{
  "sales_rep_id": 1,
  "is_primary": true,
  "commission_rate_override": "12.50",
  "notes": "Assigned for Q1"
}
```

#### Update Sales Rep Assignment

```http
PUT /accounts/{account_id}/sales-reps/{rep_id}
```

#### Remove Sales Rep from Account

```http
DELETE /accounts/{account_id}/sales-reps/{rep_id}
```

---

### Approval Rules

#### List Account Approval Rules

```http
GET /accounts/{account_id}/approval-rules
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "account_id": 1,
      "name": "Orders over $1000",
      "rule_type": "order_total",
      "threshold": "1000.0000",
      "applies_to_roles": [3],
      "approver_role_id": 2,
      "is_active": true,
      "priority": 10,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Get Approval Rule

```http
GET /accounts/{account_id}/approval-rules/{rule_id}
```

#### Create Approval Rule

```http
POST /accounts/{account_id}/approval-rules
```

**Request Body:**
```json
{
  "name": "High-value order approval",
  "rule_type": "order_total",
  "threshold": "5000.00",
  "applies_to_roles": [3, 4],
  "approver_role_id": 2,
  "is_active": true,
  "priority": 10
}
```

**Required Fields:** `name`, `rule_type`

#### Update Approval Rule

```http
PUT /accounts/{account_id}/approval-rules/{rule_id}
```

#### Delete Approval Rule

```http
DELETE /accounts/{account_id}/approval-rules/{rule_id}
```

---

## Account Roles API

**Base Path:** `/api/v1/commerce/accounts/roles`

**Required Scopes:** `read_accounts`, `write_accounts`

### List Account Roles

```http
GET /accounts/roles
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "name": "Admin",
      "description": "Full account access",
      "permissions": ["manage_contacts", "manage_locations", "approve_orders", "view_billing"],
      "is_system": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "uuid": "...",
      "name": "Buyer",
      "description": "Can place and view orders",
      "permissions": ["place_orders", "view_orders"],
      "is_system": false,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Get Account Role

```http
GET /accounts/roles/{role_id}
```

### Create Account Role

```http
POST /accounts/roles
```

**Request Body:**
```json
{
  "name": "Approver",
  "description": "Can approve purchase orders",
  "permissions": ["approve_orders", "view_orders", "view_billing"]
}
```

**Required Fields:** `name`

### Update Account Role

```http
PUT /accounts/roles/{role_id}
```

### Delete Account Role

```http
DELETE /accounts/roles/{role_id}
```

---

## Customers API

> **Note:** Direct customer CRUD endpoints (`/customers`, `/customers/{id}`, `/customers/{id}/addresses`, `/customers/{id}/wishlists`) have been removed in favor of the B2B [Accounts API](#accounts-api). Customers are now managed as contacts within accounts.

**Base Path:** `/api/v1/commerce/customers`

**Required Scopes:** `read_customers`, `write_customers`

See [Customer Groups](#customer-groups-api) below for customer group management.

---

## Customer Groups API

**Base Path:** `/api/v1/commerce/customers/groups`

**Required Scopes:** `read_customers`, `write_customers`

### List Customer Groups

```http
GET /customers/groups
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "name": "General",
      "discount_type": null,
      "discount_amount": null,
      "category_access_type": "all",
      "is_default": true,
      "is_group_for_guests": false,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "uuid": "...",
      "name": "Wholesale",
      "discount_type": "percent",
      "discount_amount": "15.0000",
      "category_access_type": "all",
      "is_default": false,
      "is_group_for_guests": false,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Get Customer Group

```http
GET /customers/groups/{group_id}
```

### Create Customer Group

```http
POST /customers/groups
```

**Request Body:**
```json
{
  "name": "VIP",
  "discount_type": "percent",
  "discount_amount": "20.00",
  "category_access_type": "all"
}
```

### Update Customer Group

```http
PUT /customers/groups/{group_id}
```

### Delete Customer Group

```http
DELETE /customers/groups/{group_id}
```

---

## Carts API

**Base Path:** `/api/v1/commerce/carts`

**Required Scopes:** `read_orders`, `write_orders`

### List Carts

```http
GET /carts
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `channel_id` | integer | Filter by channel |
| `customer_id` | integer | Filter by customer |
| `email` | string | Filter by guest email |
| `status` | string | Filter by status: `active`, `abandoned`, `converted` |
| `created_at:min` | datetime | Created after date |
| `include` | string | Include: `items` |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "channel_id": 1,
      "customer_id": 1,
      "account_id": null,
      "contact_id": null,
      "currency_code": "USD",
      "base_amount": "199.0000",
      "discount_amount": "10.0000",
      "tax_amount": "15.1100",
      "cart_amount": "204.1100",
      "coupon_codes": ["SAVE10"],
      "gift_certificate_codes": [],
      "email": null,
      "locale": "en-US",
      "status": "active",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "expires_at": "2024-02-14T10:00:00Z"
    }
  ],
  "meta": { "pagination": { ... } }
}
```

### Get Cart

```http
GET /carts/{cart_id}
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `include` | string | Include: `items`, `customer` |

**Response with items:**
```json
{
  "data": {
    "id": 1,
    "uuid": "...",
    "channel_id": 1,
    "customer_id": 1,
    "currency_code": "USD",
    "base_amount": "199.0000",
    "discount_amount": "10.0000",
    "tax_amount": "15.1100",
    "cart_amount": "204.1100",
    "coupon_codes": ["SAVE10"],
    "items": [
      {
        "id": 1,
        "uuid": "...",
        "cart_id": 1,
        "product_id": 1,
        "variant_id": 5,
        "quantity": 1,
        "list_price": "199.0000",
        "sale_price": null,
        "extended_list_price": "199.0000",
        "extended_sale_price": null,
        "discount_amount": "10.0000",
        "product": {
          "id": 1,
          "name": "iPhone 15 Pro",
          "sku": "IPHONE15PRO-256-BLACK"
        }
      }
    ]
  }
}
```

### Create Cart

```http
POST /carts
```

**Request Body:**
```json
{
  "channel_id": 1,
  "customer_id": 1,
  "account_id": 1,
  "contact_id": 1,
  "currency_code": "USD",
  "locale": "en-US",
  "items": [
    {
      "product_id": 1,
      "variant_id": 5,
      "quantity": 2
    }
  ]
}
```

**Required Fields:** `channel_id`

### Update Cart

```http
PUT /carts/{cart_id}
```

**Request Body:**
```json
{
  "customer_id": 2,
  "coupon_codes": ["SAVE10", "FREESHIP"]
}
```

### Delete Cart

```http
DELETE /carts/{cart_id}
```

---

### Cart Items

#### List Cart Items

```http
GET /carts/{cart_id}/items
```

#### Get Cart Item

```http
GET /carts/{cart_id}/items/{item_id}
```

#### Add Item to Cart

```http
POST /carts/{cart_id}/items
```

**Request Body:**
```json
{
  "product_id": 2,
  "variant_id": 10,
  "quantity": 1,
  "modifier_selections": [
    { "modifier_id": 1, "value": "Happy Birthday!" }
  ]
}
```

**Validation Errors:**
```json
{
  "status": 422,
  "title": "Validation Error",
  "errors": {
    "product_id": "Product with ID 999 does not exist.",
    "variant_id": "Variant ID 10 does not belong to product ID 2.",
    "quantity": "Quantity exceeds maximum purchase limit of 5 for this product."
  }
}
```

#### Update Cart Item

```http
PUT /carts/{cart_id}/items/{item_id}
```

**Request Body:**
```json
{
  "quantity": 3
}
```

#### Remove Cart Item

```http
DELETE /carts/{cart_id}/items/{item_id}
```

---

## Orders API

**Base Path:** `/api/v1/commerce/orders`

**Required Scopes:** `read_orders`, `write_orders`

### List Orders

```http
GET /orders
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `channel_id` | integer | Filter by channel |
| `customer_id` | integer | Filter by customer |
| `account_id` | integer | Filter by account |
| `contact_id` | integer | Filter by contact |
| `sales_rep_id` | integer | Filter by sales rep |
| `status` | string | Filter by status |
| `status:in` | string | Filter by multiple statuses |
| `payment_status` | string | Filter by payment status |
| `order_number` | string | Filter by order number |
| `email` | string | Filter by customer email |
| `date_created:min` | datetime | Created after date |
| `date_created:max` | datetime | Created before date |
| `date_modified:min` | datetime | Modified after date |
| `total_inc_tax:min` | decimal | Minimum order total |
| `total_inc_tax:max` | decimal | Maximum order total |
| `sort` | string | Sort field |
| `direction` | string | Sort direction |
| `include` | string | Include: `items`, `shipping_addresses`, `transactions` |

**Order Statuses:**
- `pending`
- `awaiting_payment`
- `awaiting_fulfillment`
- `awaiting_shipment`
- `partially_shipped`
- `shipped`
- `completed`
- `cancelled`
- `declined`
- `refunded`
- `partially_refunded`
- `disputed`
- `manual_verification_required`

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "channel_id": 1,
      "customer_id": 1,
      "account_id": null,
      "contact_id": null,
      "sales_rep_id": null,
      "approval_status": "none",
      "order_number": "ORD-10001",
      "status": "awaiting_shipment",
      "payment_status": "captured",
      "currency_code": "USD",
      "currency_exchange_rate": "1.0000000000",
      "subtotal_ex_tax": "999.0000",
      "subtotal_inc_tax": "1073.9250",
      "shipping_cost_ex_tax": "15.0000",
      "shipping_cost_inc_tax": "16.1250",
      "handling_cost_ex_tax": "0.0000",
      "handling_cost_inc_tax": "0.0000",
      "wrapping_cost_ex_tax": "0.0000",
      "wrapping_cost_inc_tax": "0.0000",
      "discount_amount": "50.0000",
      "coupon_discount": "50.0000",
      "gift_certificate_amount": "0.0000",
      "store_credit_amount": "0.0000",
      "total_ex_tax": "964.0000",
      "total_inc_tax": "1040.0500",
      "total_tax": "76.0500",
      "items_total": 1,
      "items_shipped": 0,
      "refunded_amount": "0.0000",
      "billing_address": {
        "first_name": "John",
        "last_name": "Doe",
        "address1": "123 Main St",
        "city": "San Francisco",
        "state": "CA",
        "postal_code": "94102",
        "country": "United States",
        "country_code": "US"
      },
      "customer_message": "Please ship ASAP",
      "staff_notes": null,
      "external_id": null,
      "external_source": null,
      "ip_address": "192.168.1.1",
      "payment_method": "credit_card",
      "payment_provider_id": "pi_abc123",
      "date_created": "2024-01-15T10:00:00Z",
      "date_modified": "2024-01-15T10:30:00Z",
      "date_shipped": null,
      "metafields": {}
    }
  ],
  "meta": { "pagination": { ... } }
}
```

### Get Order

```http
GET /orders/{order_id}
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `include` | string | Include: `items`, `shipping_addresses`, `shipments`, `transactions`, `refunds`, `customer` |

### Create Order

```http
POST /orders
```

**Request Body:**
```json
{
  "channel_id": 1,
  "customer_id": 1,
  "account_id": 1,
  "contact_id": 1,
  "sales_rep_id": 1,
  "status": "awaiting_payment",
  "currency_code": "USD",
  "billing_address": {
    "first_name": "John",
    "last_name": "Doe",
    "address1": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "postal_code": "94102",
    "country": "United States",
    "country_code": "US"
  },
  "items": [
    {
      "product_id": 1,
      "variant_id": 5,
      "quantity": 1,
      "price_ex_tax": "999.00",
      "price_inc_tax": "1073.93"
    }
  ],
  "shipping_addresses": [
    {
      "first_name": "John",
      "last_name": "Doe",
      "address1": "123 Main St",
      "city": "San Francisco",
      "state_or_province": "California",
      "state_or_province_code": "CA",
      "postal_code": "94102",
      "country": "United States",
      "country_code": "US",
      "shipping_method": "Standard Shipping",
      "cost_ex_tax": "15.00",
      "cost_inc_tax": "16.13"
    }
  ]
}
```

**Required Fields:** `channel_id`, `billing_address`, `items`

### Update Order

```http
PUT /orders/{order_id}
```

**Request Body:**
```json
{
  "status": "awaiting_shipment",
  "staff_notes": "Customer called - urgent delivery requested"
}
```

### Delete Order

```http
DELETE /orders/{order_id}
```

**Scope:** `write_orders`

### Update Order Status

```http
PUT /orders/{order_id}/status
```

**Scope:** `write_orders`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | Yes | New order status |

**Allowed statuses:** `pending`, `awaiting_payment`, `awaiting_fulfillment`, `awaiting_shipment`, `awaiting_pickup`, `partially_shipped`, `shipped`, `completed`, `cancelled`, `declined`, `refunded`, `disputed`, `manual_verification_required`

**Request Body:**
```json
{
  "status": "shipped"
}
```

---

### Order Items

#### List Order Items

```http
GET /orders/{order_id}/items
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "order_id": 1,
      "product_id": 1,
      "variant_id": 5,
      "name": "iPhone 15 Pro - 256GB / Black Titanium",
      "sku": "IPHONE15PRO-256-BLACK",
      "quantity": 1,
      "quantity_shipped": 0,
      "quantity_refunded": 0,
      "base_price": "999.0000",
      "price_ex_tax": "999.0000",
      "price_inc_tax": "1073.9250",
      "price_tax": "74.9250",
      "base_total": "999.0000",
      "total_ex_tax": "999.0000",
      "total_inc_tax": "1073.9250",
      "total_tax": "74.9250",
      "base_cost_price": "700.0000",
      "discount_amount": "0.0000",
      "coupon_amount": "0.0000",
      "weight": "0.2060",
      "type": "physical",
      "product_options": [
        { "option_id": 1, "option_name": "Storage", "value": "256GB" },
        { "option_id": 2, "option_name": "Color", "value": "Black Titanium" }
      ],
      "is_refunded": false,
      "refund_amount": "0.0000"
    }
  ]
}
```

#### Add Order Item

```http
POST /orders/{order_id}/items
```

**Note:** Adding items recalculates order totals.

#### Update Order Item

```http
PUT /orders/{order_id}/items/{item_id}
```

#### Remove Order Item

```http
DELETE /orders/{order_id}/items/{item_id}
```

---

### Order Shipping Addresses

#### List Order Shipping Addresses

```http
GET /orders/{order_id}/shipping-addresses
```

#### Get Order Shipping Address

```http
GET /orders/{order_id}/shipping-addresses/{address_id}
```

#### Add Shipping Address

```http
POST /orders/{order_id}/shipping-addresses
```

#### Update Shipping Address

```http
PUT /orders/{order_id}/shipping-addresses/{address_id}
```

#### Delete Order Shipping Address

```http
DELETE /orders/{order_id}/shipping-addresses/{address_id}
```

---

### Order Transactions

#### List Order Transactions

```http
GET /orders/{order_id}/transactions
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "order_id": 1,
      "event": "authorization",
      "method": "credit_card",
      "amount": "1040.0500",
      "currency_code": "USD",
      "status": "ok",
      "gateway": "stripe",
      "gateway_transaction_id": "pi_abc123",
      "fraud_review": false,
      "avs_result": { "code": "Y", "message": "Address matches" },
      "cvv_result": { "code": "M", "message": "CVV matches" },
      "date_created": "2024-01-15T10:05:00Z"
    },
    {
      "id": 2,
      "uuid": "...",
      "order_id": 1,
      "event": "capture",
      "method": "credit_card",
      "amount": "1040.0500",
      "currency_code": "USD",
      "status": "ok",
      "gateway": "stripe",
      "gateway_transaction_id": "pi_abc123_capture",
      "reference_transaction_id": 1,
      "date_created": "2024-01-15T10:10:00Z"
    }
  ]
}
```

#### Create Transaction

```http
POST /orders/{order_id}/transactions
```

**Request Body:**
```json
{
  "event": "capture",
  "method": "credit_card",
  "amount": "1040.05",
  "currency_code": "USD",
  "status": "ok",
  "gateway": "stripe",
  "gateway_transaction_id": "pi_abc123_capture",
  "reference_transaction_id": 1
}
```

**Transaction Events:** `authorization`, `capture`, `purchase`, `refund`, `void`

---

### Order Refunds

#### List Order Refunds

```http
GET /orders/{order_id}/refunds
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "order_id": 1,
      "reason": "Customer requested refund - item defective",
      "total_amount": "1073.9250",
      "tax_adjustment_amount": "74.9250",
      "created_by_user_id": 1,
      "transaction_id": 3,
      "payment_method": "original_method",
      "date_created": "2024-01-20T14:00:00Z",
      "items": [
        {
          "id": 1,
          "refund_id": 1,
          "order_item_id": 1,
          "quantity": 1,
          "item_type": "product",
          "requested_amount": "999.0000",
          "reason": "Defective screen"
        }
      ]
    }
  ]
}
```

#### Create Refund

```http
POST /orders/{order_id}/refunds
```

**Request Body:**
```json
{
  "reason": "Customer requested refund",
  "payment_method": "original_method",
  "items": [
    {
      "order_item_id": 1,
      "quantity": 1,
      "item_type": "product",
      "requested_amount": "999.00",
      "reason": "Item not as described"
    }
  ]
}
```

**Payment Methods:** `original_method`, `store_credit`, `offline`

---

## Shipments API

**Base Path:** `/api/v1/commerce/orders/{order_id}/shipments`

**Required Scopes:** `read_orders`, `write_orders`

### List Shipments

```http
GET /orders/{order_id}/shipments
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "order_id": 1,
      "order_shipping_address_id": 1,
      "tracking_number": "1Z999AA10123456784",
      "tracking_carrier": "ups",
      "tracking_url": "https://ups.com/track?num=1Z999AA10123456784",
      "shipping_method": "UPS Ground",
      "shipping_provider": "UPS",
      "comments": "Left at front door",
      "date_created": "2024-01-16T09:00:00Z",
      "date_shipped": "2024-01-16T10:00:00Z",
      "items": [
        {
          "id": 1,
          "shipment_id": 1,
          "order_item_id": 1,
          "quantity": 1
        }
      ]
    }
  ]
}
```

### Get Shipment

```http
GET /orders/{order_id}/shipments/{shipment_id}
```

### Create Shipment

```http
POST /orders/{order_id}/shipments
```

**Request Body:**
```json
{
  "order_shipping_address_id": 1,
  "tracking_number": "1Z999AA10123456784",
  "tracking_carrier": "ups",
  "shipping_method": "UPS Ground",
  "shipping_provider": "UPS",
  "items": [
    { "order_item_id": 1, "quantity": 1 }
  ],
  "comments": "Signature required"
}
```

**Validation Errors:**
```json
{
  "status": 422,
  "title": "Validation Error",
  "errors": {
    "items[0].quantity": "Cannot ship 2 units of order item 1. Only 1 unit remaining unshipped.",
    "order_shipping_address_id": "Shipping address ID 999 does not exist for this order."
  }
}
```

### Update Shipment

```http
PUT /orders/{order_id}/shipments/{shipment_id}
```

### Delete Shipment

```http
DELETE /orders/{order_id}/shipments/{shipment_id}
```

---

## Pricing API

**Base Path:** `/api/v1/commerce/pricing`

**Required Scopes:** `read_pricing`, `write_pricing`

### Price Lists

#### List Price Lists

```http
GET /pricing/price-lists
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `is_active` | boolean | Filter by active status |
| `currency_code` | string | Filter by currency |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "name": "Wholesale Pricing",
      "currency_code": "USD",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Get Price List

```http
GET /pricing/price-lists/{price_list_id}
```

#### Create Price List

```http
POST /pricing/price-lists
```

**Request Body:**
```json
{
  "name": "European Pricing",
  "currency_code": "EUR",
  "is_active": true
}
```

#### Update Price List

```http
PUT /pricing/price-lists/{price_list_id}
```

#### Delete Price List

```http
DELETE /pricing/price-lists/{price_list_id}
```

---

### Price List Records

#### List Price List Records

```http
GET /pricing/price-lists/{price_list_id}/records
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `variant_id` | integer | Filter by variant |
| `variant_id:in` | string | Filter by multiple variants |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "price_list_id": 1,
      "variant_id": 5,
      "price": "850.0000",
      "sale_price": null,
      "retail_price": "999.0000",
      "map_price": "900.0000",
      "bulk_pricing_tiers": [
        { "quantity_min": 10, "quantity_max": 24, "type": "percent", "amount": "5" },
        { "quantity_min": 25, "quantity_max": null, "type": "percent", "amount": "10" }
      ],
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Get Price List Record

```http
GET /pricing/price-lists/{price_list_id}/records/{variant_id}
```

#### Update Price List Record

```http
PUT /pricing/price-lists/{price_list_id}/records/{variant_id}
```

#### Upsert Price List Records

```http
PUT /pricing/price-lists/{price_list_id}/records
```

**Request Body:**
```json
{
  "records": [
    {
      "variant_id": 5,
      "price": "850.00",
      "sale_price": "799.00"
    },
    {
      "variant_id": 6,
      "price": "950.00"
    }
  ]
}
```

#### Delete Price List Record

```http
DELETE /pricing/price-lists/{price_list_id}/records/{variant_id}
```

---

### Price List Assignments

#### List Price List Assignments

```http
GET /pricing/price-lists/assignments
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `price_list_id` | integer | Filter by price list |
| `channel_id` | integer | Filter by channel |
| `customer_group_id` | integer | Filter by customer group |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "price_list_id": 1,
      "channel_id": 1,
      "customer_group_id": 2,
      "priority": 10,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Get Price List Assignment

```http
GET /pricing/price-lists/assignments/{assignment_id}
```

#### Create Price List Assignment

```http
POST /pricing/price-lists/assignments
```

**Request Body:**
```json
{
  "price_list_id": 1,
  "channel_id": 1,
  "customer_group_id": 2,
  "priority": 10
}
```

#### Update Price List Assignment

```http
PUT /pricing/price-lists/assignments/{assignment_id}
```

#### Delete Price List Assignment

```http
DELETE /pricing/price-lists/assignments/{assignment_id}
```

---

## Promotions API

**Base Path:** `/api/v1/commerce/promotions`

**Required Scopes:** `read_pricing`, `write_pricing`

### List Promotions

```http
GET /promotions
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status: `enabled`, `disabled` |
| `redemption_type` | string | Filter by type: `automatic`, `coupon` |
| `channel_id` | integer | Filter by channel |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "name": "Summer Sale - 20% Off",
      "redemption_type": "automatic",
      "channel_ids": [1],
      "customer_group_ids": [],
      "priority": 10,
      "status": "enabled",
      "start_date": "2024-06-01T00:00:00Z",
      "end_date": "2024-08-31T23:59:59Z",
      "max_uses": null,
      "current_uses": 150,
      "stop": false,
      "can_be_combined": true,
      "rules": {
        "conditions": {
          "cart_subtotal_min": 100
        },
        "actions": {
          "type": "percent_off",
          "amount": 20,
          "applies_to": "order"
        }
      },
      "created_at": "2024-05-15T00:00:00Z",
      "updated_at": "2024-06-01T00:00:00Z"
    }
  ]
}
```

### Get Promotion

```http
GET /promotions/{promotion_id}
```

### Create Promotion

```http
POST /promotions
```

**Request Body:**
```json
{
  "name": "Free Shipping Over $50",
  "redemption_type": "automatic",
  "channel_ids": [1],
  "status": "enabled",
  "start_date": "2024-01-01T00:00:00Z",
  "end_date": null,
  "rules": {
    "conditions": {
      "cart_subtotal_min": 50
    },
    "actions": {
      "type": "free_shipping"
    }
  }
}
```

### Update Promotion

```http
PUT /promotions/{promotion_id}
```

### Delete Promotion

```http
DELETE /promotions/{promotion_id}
```

---

## Coupons API

**Base Path:** `/api/v1/commerce/promotions/coupons`

**Required Scopes:** `read_pricing`, `write_pricing`

### List Coupons

```http
GET /promotions/coupons
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `promotion_id` | integer | Filter by promotion |
| `code` | string | Filter by exact code |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "promotion_id": 2,
      "code": "SAVE20",
      "max_uses": 1000,
      "max_uses_per_customer": 1,
      "current_uses": 245,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Create Coupon

```http
POST /promotions/coupons
```

**Request Body:**
```json
{
  "promotion_id": 2,
  "code": "HOLIDAY25",
  "max_uses": 500,
  "max_uses_per_customer": 1
}
```

**Validation Errors:**
```json
{
  "status": 422,
  "title": "Validation Error",
  "errors": {
    "code": "Coupon code 'HOLIDAY25' already exists. Codes must be unique.",
    "promotion_id": "Promotion with ID 999 does not exist."
  }
}
```

### Update Coupon

```http
PUT /promotions/coupons/{coupon_id}
```

### Delete Coupon

```http
DELETE /promotions/coupons/{coupon_id}
```

---

### Coupon Redemptions

#### List Coupon Redemptions

```http
GET /promotions/coupons/{coupon_id}/redemptions
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "coupon_id": 1,
      "order_id": 100,
      "customer_id": 5,
      "contact_id": null,
      "discount_amount": "50.0000",
      "redeemed_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## Gift Certificates API

**Base Path:** `/api/v1/commerce/promotions/gift-certificates`

**Required Scopes:** `read_pricing`, `write_pricing`

### List Gift Certificates

```http
GET /promotions/gift-certificates
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `code` | string | Filter by exact code |
| `to_email` | string | Filter by recipient email |
| `status` | string | Filter by status: `active`, `pending`, `disabled`, `expired` |
| `balance:min` | decimal | Minimum remaining balance |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "code": "GC-ABC123XYZ",
      "original_balance": "100.0000",
      "balance": "75.0000",
      "currency_code": "USD",
      "to_name": "Jane Smith",
      "to_email": "jane@example.com",
      "from_name": "John Doe",
      "from_email": "john@example.com",
      "message": "Happy Birthday!",
      "order_id": 50,
      "customer_id": 1,
      "contact_id": null,
      "template": "birthday",
      "status": "active",
      "expiry_date": "2025-01-15",
      "date_created": "2024-01-15T00:00:00Z",
      "date_purchased": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Get Gift Certificate

```http
GET /promotions/gift-certificates/{gift_certificate_id}
```

### Create Gift Certificate

```http
POST /promotions/gift-certificates
```

**Request Body:**
```json
{
  "original_balance": "50.00",
  "currency_code": "USD",
  "to_name": "Friend Name",
  "to_email": "friend@example.com",
  "from_name": "Your Name",
  "message": "Enjoy your gift!",
  "template": "default",
  "expiry_date": "2025-12-31"
}
```

### Update Gift Certificate

```http
PUT /promotions/gift-certificates/{gift_certificate_id}
```

### Adjust Gift Certificate Balance

```http
POST /promotions/gift-certificates/{gift_certificate_id}/adjust
```

**Request Body:**
```json
{
  "amount": "-25.00",
  "reason": "Applied to order #12345"
}
```

---

## Shipping API

**Base Path:** `/api/v1/commerce/shipping`

**Required Scopes:** `read_content`, `write_content`

### Shipping Zones

#### List Shipping Zones

```http
GET /shipping/zones
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "name": "United States",
      "type": "country",
      "locations": [
        { "country_code": "US" }
      ],
      "enabled": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "uuid": "...",
      "name": "California",
      "type": "state",
      "locations": [
        { "country_code": "US", "state_code": "CA" }
      ],
      "enabled": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Get Shipping Zone

```http
GET /shipping/zones/{zone_id}
```

#### Create Shipping Zone

```http
POST /shipping/zones
```

**Request Body:**
```json
{
  "name": "Europe",
  "type": "country",
  "locations": [
    { "country_code": "GB" },
    { "country_code": "DE" },
    { "country_code": "FR" }
  ],
  "enabled": true
}
```

#### Update Shipping Zone

```http
PUT /shipping/zones/{zone_id}
```

#### Delete Shipping Zone

```http
DELETE /shipping/zones/{zone_id}
```

---

### Shipping Methods

#### List Shipping Methods

```http
GET /shipping/zones/{zone_id}/methods
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "shipping_zone_id": 1,
      "name": "free_shipping",
      "type": "perorder",
      "display_name": "Free Standard Shipping",
      "fixed_cost": "0.0000",
      "rate_per_item": null,
      "rate_per_weight": null,
      "rate_ranges": [],
      "carrier": null,
      "carrier_service_code": null,
      "carrier_options": {},
      "handling_fee": null,
      "handling_fee_type": null,
      "enabled": true,
      "sort_order": 0,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "uuid": "...",
      "shipping_zone_id": 1,
      "name": "ups_ground",
      "type": "carrier",
      "display_name": "UPS Ground",
      "carrier": "ups",
      "carrier_service_code": "03",
      "carrier_options": {
        "account_number": "ABC123"
      },
      "handling_fee": "2.0000",
      "handling_fee_type": "fixed",
      "enabled": true,
      "sort_order": 1
    }
  ]
}
```

#### Get Shipping Method

```http
GET /shipping/zones/{zone_id}/methods/{method_id}
```

#### Create Shipping Method

```http
POST /shipping/zones/{zone_id}/methods
```

**Request Body (Flat Rate):**
```json
{
  "name": "flat_rate",
  "type": "perorder",
  "display_name": "Flat Rate Shipping",
  "fixed_cost": "9.99",
  "enabled": true
}
```

**Request Body (Weight-Based):**
```json
{
  "name": "weight_based",
  "type": "weight",
  "display_name": "Weight-Based Shipping",
  "rate_ranges": [
    { "min": 0, "max": 5, "rate": "5.99" },
    { "min": 5.01, "max": 10, "rate": "9.99" },
    { "min": 10.01, "max": null, "rate": "14.99" }
  ],
  "enabled": true
}
```

**Shipping Method Types:** `perorder`, `peritem`, `weight`, `price`, `pickup`, `carrier`

#### Update Shipping Method

```http
PUT /shipping/zones/{zone_id}/methods/{method_id}
```

#### Delete Shipping Method

```http
DELETE /shipping/zones/{zone_id}/methods/{method_id}
```

---

## Tax API

**Base Path:** `/api/v1/commerce/tax`

**Required Scopes:** `read_content`, `write_content`

### Tax Classes

#### List Tax Classes

```http
GET /tax/classes
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "name": "Default Tax Class",
      "is_default": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "uuid": "...",
      "name": "Reduced Rate",
      "is_default": false,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Create Tax Class

```http
POST /tax/classes
```

**Request Body:**
```json
{
  "name": "Zero Rate",
  "is_default": false
}
```

#### Update Tax Class

```http
PUT /tax/classes/{class_id}
```

#### Delete Tax Class

```http
DELETE /tax/classes/{class_id}
```

---

### Tax Rates

#### List Tax Rates

```http
GET /tax/rates
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `tax_class_id` | integer | Filter by tax class |
| `country_code` | string | Filter by country |
| `state_code` | string | Filter by state |
| `enabled` | boolean | Filter by enabled status |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "tax_class_id": 1,
      "name": "California State Tax",
      "country_code": "US",
      "state_code": "CA",
      "postal_codes": null,
      "rate": "0.0725",
      "priority": 0,
      "is_compound": false,
      "enabled": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Create Tax Rate

```http
POST /tax/rates
```

**Request Body:**
```json
{
  "tax_class_id": 1,
  "name": "NY State Tax",
  "country_code": "US",
  "state_code": "NY",
  "rate": "0.04",
  "priority": 0,
  "enabled": true
}
```

#### Update Tax Rate

```http
PUT /tax/rates/{rate_id}
```

#### Delete Tax Rate

```http
DELETE /tax/rates/{rate_id}
```

---

## Inventory API

**Base Path:** `/api/v1/commerce/inventory`

**Required Scopes:** `read_inventory`, `write_inventory`

### Inventory Locations

#### List Inventory Locations

```http
GET /inventory/locations
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Filter by type: `warehouse`, `store`, `dropshipper` |
| `is_active` | boolean | Filter by active status |
| `is_shipping_enabled` | boolean | Filter by shipping enabled |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "name": "Main Warehouse",
      "code": "MAIN-WH",
      "type": "warehouse",
      "address": {
        "address1": "100 Warehouse Way",
        "city": "Dallas",
        "state": "TX",
        "postal_code": "75001",
        "country": "US"
      },
      "is_active": true,
      "is_shipping_enabled": true,
      "is_pickup_enabled": false,
      "fulfillment_priority": 1,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Create Inventory Location

```http
POST /inventory/locations
```

**Request Body:**
```json
{
  "name": "East Coast Warehouse",
  "code": "EAST-WH",
  "type": "warehouse",
  "address": {
    "address1": "500 Distribution Dr",
    "city": "Newark",
    "state": "NJ",
    "postal_code": "07102",
    "country": "US"
  },
  "is_active": true,
  "is_shipping_enabled": true,
  "fulfillment_priority": 2
}
```

#### Update Inventory Location

```http
PUT /inventory/locations/{location_id}
```

#### Delete Inventory Location

```http
DELETE /inventory/locations/{location_id}
```

---

### Inventory Levels

#### List Inventory Levels

```http
GET /inventory/items
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `variant_id` | integer | Filter by variant |
| `variant_id:in` | string | Filter by multiple variants |
| `location_id` | integer | Filter by location |
| `available:min` | integer | Minimum available quantity |
| `available:max` | integer | Maximum available quantity |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "variant_id": 5,
      "location_id": 1,
      "available": 50,
      "reserved": 5,
      "incoming": 100,
      "warning_level": 10,
      "bin_location": "A-15-B",
      "updated_at": "2024-01-15T10:30:00Z",
      "variant": {
        "id": 5,
        "sku": "IPHONE15PRO-256-BLACK",
        "product_id": 1,
        "product_name": "iPhone 15 Pro"
      },
      "location": {
        "id": 1,
        "name": "Main Warehouse",
        "code": "MAIN-WH"
      }
    }
  ]
}
```

#### Get Inventory Level

```http
GET /inventory/items/{variant_id}/{location_id}
```

#### Set Inventory Level

```http
PUT /inventory/items/{variant_id}/{location_id}
```

**Request Body:**
```json
{
  "available": 100,
  "warning_level": 20,
  "bin_location": "B-20-C"
}
```

---

### Inventory Adjustments

#### Adjust Inventory

```http
POST /inventory/adjustments
```

**Request Body:**
```json
{
  "variant_id": 5,
  "location_id": 1,
  "adjustment": -10,
  "reason": "sold",
  "reference": "ORD-10001"
}
```

**Adjustment Reasons:**
- `sold` - Sold through order
- `received` - Received from supplier
- `returned` - Customer return
- `damaged` - Damaged/lost inventory
- `correction` - Manual correction
- `transfer_in` - Transferred from another location
- `transfer_out` - Transferred to another location

**Validation Errors:**
```json
{
  "status": 422,
  "title": "Validation Error",
  "errors": {
    "adjustment": "Cannot reduce available quantity below 0. Current available: 5, requested adjustment: -10."
  }
}
```

#### Batch Adjust Inventory

```http
POST /inventory/adjustments/batch
```

**Request Body:**
```json
{
  "adjustments": [
    { "variant_id": 5, "location_id": 1, "adjustment": -2, "reason": "sold" },
    { "variant_id": 6, "location_id": 1, "adjustment": -1, "reason": "sold" }
  ],
  "reference": "ORD-10002"
}
```

---

## Reviews API

**Base Path:** `/api/v1/commerce/reviews`

**Required Scopes:** `read_products`, `write_products`

### List Reviews

```http
GET /reviews
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `product_id` | integer | Filter by product |
| `customer_id` | integer | Filter by customer |
| `status` | string | Filter by status: `pending`, `approved`, `rejected` |
| `rating:min` | integer | Minimum rating (1-5) |
| `rating:max` | integer | Maximum rating (1-5) |
| `date_created:min` | datetime | Created after date |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "product_id": 1,
      "customer_id": 5,
      "contact_id": null,
      "order_id": 100,
      "title": "Great product!",
      "text": "This iPhone is amazing. Fast, great camera, love the design.",
      "rating": 5,
      "author_name": "John D.",
      "author_email": "john@example.com",
      "status": "approved",
      "date_created": "2024-01-20T14:00:00Z",
      "date_reviewed": "2024-01-21T09:00:00Z",
      "date_modified": "2024-01-21T09:00:00Z"
    }
  ]
}
```

### Get Review

```http
GET /reviews/{review_id}
```

### Create Review

```http
POST /reviews
```

**Request Body:**
```json
{
  "product_id": 1,
  "customer_id": 5,
  "contact_id": 1,
  "order_id": 100,
  "title": "Excellent purchase",
  "text": "Very happy with this product. Would recommend!",
  "rating": 5,
  "author_name": "Jane S."
}
```

**Required Fields:** `product_id`, `rating`

### Update Review

```http
PUT /reviews/{review_id}
```

**Request Body:**
```json
{
  "status": "approved"
}
```

### Delete Review

```http
DELETE /reviews/{review_id}
```

---

## Webhooks API

**Base Path:** `/api/v1/commerce/webhooks`

**Required Scopes:** `read_content`, `write_content`

### List Webhooks

```http
GET /webhooks
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `scope` | string | Filter by scope |
| `is_active` | boolean | Filter by active status |
| `channel_id` | integer | Filter by channel |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "scope": "store/order/created",
      "destination_url": "https://api.example.com/webhooks/orders",
      "is_active": true,
      "headers": {
        "X-Custom-Header": "value"
      },
      "channel_id": null,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Available Webhook Scopes

| Scope | Description |
|-------|-------------|
| `store/order/created` | New order created |
| `store/order/updated` | Order updated |
| `store/order/statusUpdated` | Order status changed |
| `store/order/archived` | Order archived |
| `store/product/created` | New product created |
| `store/product/updated` | Product updated |
| `store/product/deleted` | Product deleted |
| `store/product/inventory/updated` | Inventory changed |
| `store/customer/created` | New customer registered |
| `store/customer/updated` | Customer updated |
| `store/customer/deleted` | Customer deleted |
| `store/cart/created` | Cart created |
| `store/cart/updated` | Cart updated |
| `store/cart/abandoned` | Cart abandoned |
| `store/cart/converted` | Cart converted to order |
| `store/shipment/created` | Shipment created |
| `store/shipment/updated` | Shipment updated |

### Create Webhook

```http
POST /webhooks
```

**Request Body:**
```json
{
  "scope": "store/order/created",
  "destination_url": "https://api.example.com/webhooks/orders",
  "is_active": true,
  "headers": {
    "Authorization": "Bearer secret123"
  },
  "channel_id": 1
}
```

**Validation Errors:**
```json
{
  "status": 422,
  "title": "Validation Error",
  "errors": {
    "scope": "Invalid webhook scope 'store/invalid/event'. See documentation for available scopes.",
    "destination_url": "URL must use HTTPS protocol."
  }
}
```

### Update Webhook

```http
PUT /webhooks/{webhook_id}
```

### Delete Webhook

```http
DELETE /webhooks/{webhook_id}
```

---

### Webhook Events

#### List Webhook Events

```http
GET /webhooks/{webhook_id}/events
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status: `pending`, `sent`, `failed`, `retrying` |
| `created_at:min` | datetime | Created after date |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "webhook_id": 1,
      "scope": "store/order/created",
      "payload": {
        "order_id": 100,
        "order_number": "ORD-10001"
      },
      "response_code": 200,
      "response_body": "{\"received\": true}",
      "status": "sent",
      "attempts": 1,
      "max_attempts": 5,
      "created_at": "2024-01-15T10:30:00Z",
      "sent_at": "2024-01-15T10:30:01Z",
      "next_retry_at": null
    }
  ]
}
```

#### Retry Webhook Event

```http
POST /webhooks/{webhook_id}/events/{event_id}/retry
```

---

## Settings API

**Base Path:** `/api/v1/commerce/settings`

**Required Scopes:** `read_content`, `write_content`

### List Store Settings

```http
GET /settings
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "setting_key": "store_name",
      "setting_value": "My Awesome Store",
      "description": "The public name of the store",
      "is_sensitive": false,
      "updated_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "setting_key": "currency_default",
      "setting_value": "USD",
      "description": "Default store currency",
      "is_sensitive": false,
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Get Store Setting

```http
GET /settings/{setting_key}
```

### Upsert Store Setting

```http
PUT /settings/{setting_key}
```

**Request Body:**
```json
{
  "setting_value": "Updated Store Name",
  "description": "The public name of the store"
}
```

### Delete Store Setting

```http
DELETE /settings/{setting_key}
```

---

### Admin Users

#### List Admin Users

```http
GET /settings/admin-users
```

**Required Scope:** `full_access`

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "email": "admin@example.com",
      "first_name": "Admin",
      "last_name": "User",
      "role": "owner",
      "permissions": {},
      "channel_ids": null,
      "is_active": true,
      "two_factor_enabled": true,
      "last_login_at": "2024-01-15T09:00:00Z",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Create Admin User

```http
POST /settings/admin-users
```

**Request Body:**
```json
{
  "email": "staff@example.com",
  "password": "securepassword123",
  "first_name": "Staff",
  "last_name": "Member",
  "role": "staff",
  "permissions": {
    "orders": ["read", "write"],
    "products": ["read"]
  },
  "channel_ids": [1]
}
```

**Roles:** `owner`, `admin`, `staff`

#### Update Admin User

```http
PUT /settings/admin-users/{user_id}
```

#### Delete Admin User

```http
DELETE /settings/admin-users/{user_id}
```

---

## Audit Log API

**Base Path:** `/api/v1/commerce/audit`

**Required Scopes:** `read_content` (read-only)

### List Audit Log Entries

```http
GET /audit
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `admin_user_id` | integer | Filter by admin user |
| `customer_id` | integer | Filter by customer |
| `account_id` | integer | Filter by account |
| `contact_id` | integer | Filter by contact |
| `action` | string | Filter by action |
| `entity_type` | string | Filter by entity type |
| `entity_id` | integer | Filter by entity ID |
| `created_at:min` | datetime | Created after date |
| `created_at:max` | datetime | Created before date |

**Response:**
```json
{
  "data": [
    {
      "id": "12345",
      "admin_user_id": 1,
      "customer_id": null,
      "account_id": null,
      "contact_id": null,
      "action": "update",
      "entity_type": "product",
      "entity_id": 1,
      "old_values": {
        "price": "999.00"
      },
      "new_values": {
        "price": "899.00"
      },
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": { "pagination": { ... } }
}
```

### Get Audit Log Entry

```http
GET /audit/{entry_id}
```

---

## Webhook Payload Examples

### Order Created

```json
{
  "scope": "store/order/created",
  "store_id": 1,
  "data": {
    "type": "order",
    "id": 100
  },
  "hash": "abc123...",
  "created_at": 1705312200,
  "producer": "stores/1"
}
```

### Product Updated

```json
{
  "scope": "store/product/updated",
  "store_id": 1,
  "data": {
    "type": "product",
    "id": 1
  },
  "hash": "def456...",
  "created_at": 1705312200,
  "producer": "stores/1"
}
```

### Inventory Updated

```json
{
  "scope": "store/product/inventory/updated",
  "store_id": 1,
  "data": {
    "type": "inventory",
    "variant_id": 5,
    "location_id": 1,
    "available": 45,
    "previous_available": 50
  },
  "hash": "ghi789...",
  "created_at": 1705312200,
  "producer": "stores/1"
}
```

---

## Changelog

### Version 1.1.0 (2026-02-11)

- Added B2B Accounts system with contacts, locations, addresses, sales reps, and approval rules
- Added Account Roles API for role-based access within accounts
- Added `read_accounts`/`write_accounts` scopes
- Added `account_id`, `contact_id`, `sales_rep_id`, `approval_status` fields to Orders
- Added `account_id`, `contact_id` fields to Carts, Reviews, Gift Certificates, Coupon Redemptions, and Audit Log
- Removed direct customer CRUD endpoints (replaced by Accounts API)

### Version 1.0.0 (2024-01-15)

- Initial API release
- Full CRUD support for all commerce resources
- BigCommerce-compatible error format
- Comprehensive filtering and pagination
- Webhook support for real-time events
