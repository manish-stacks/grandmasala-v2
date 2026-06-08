# Grand Masala Backend API v2.0

Node.js + Express + MongoDB backend for grandmasala.in

## Setup

```bash
npm install
cp .env.example .env   # Fill in your values
npm run dev            # Development
npm start              # Production
```

## API Base URL
`http://localhost:7500/api/v1`

## Key Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | /regsiter-user | Register new user |
| POST | /verify-otp | Verify OTP |
| POST | /login | Login |
| GET | /my-details | Get logged-in user |

### Products
| Method | Route | Description |
|--------|-------|-------------|
| GET | /get-product | All products |
| GET | /get-product/:id | Single product |
| GET | /search_product_and_filter | Search & filter |

### Orders
| Method | Route | Description |
|--------|-------|-------------|
| POST | /add-order | Create online order |
| POST | /create-cod-order | Create COD order |
| POST | /verify-payment | Razorpay verification |

### Blogs
| Method | Route | Description |
|--------|-------|-------------|
| GET | /blog | All blogs |
| GET | /blog/:slug | Blog by slug |

### Newsletter
| Method | Route | Description |
|--------|-------|-------------|
| POST | /create-newsletter | Subscribe |
| POST | /unsubscribe-newsletter | Unsubscribe |

## SEO
- Sitemap: `/sitemap.xml`
- Robots: `/robots.txt`

## Environment Variables
See `.env` file for required variables.
