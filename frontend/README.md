# Grand Masala — Next.js 15 Frontend

Full-stack e-commerce platform: Client + Admin in one Next.js 15 project.

## Tech Stack
- **Next.js 15.3** (App Router, TypeScript)
- **React 19** with Server Components
- **Redux Toolkit** (cart + checkout state)
- **Tailwind CSS v4**
- **Razorpay** integration

## Quick Start

```bash
npm install
cp .env.local.example .env.local   # fill your values
npm run dev
```

## Routes

### Client
| Route | Description |
|-------|-------------|
| `/` | Home (SSR) |
| `/shop` | Product listing |
| `/product/[id]` | Product detail + structured data |
| `/cart` | Shopping cart |
| `/checkout` | Multi-step checkout |
| `/order-success` | Order confirmation |
| `/blog` | Blog listing (SSR) |
| `/blog/[slug]` | Blog detail (SSR) |
| `/about` `/contact` | Static pages |
| `/privacy` `/terms` `/refund` `/shipping` `/return` | Policy pages (from CMS) |
| `/profile` | User account + orders |
| `/track-order` | Order tracking |
| `/login` `/register` `/forget` `/verify-otp` | Auth |

### Admin (all under `/admin`)
| Route | Description |
|-------|-------------|
| `/admin/login` | Admin login |
| `/admin` | Dashboard |
| `/admin/products` | Product list |
| `/admin/products/create` | Create product |
| `/admin/products/[id]` | Edit product |
| `/admin/orders` | Orders list |
| `/admin/orders/[id]` | Order detail |
| `/admin/users` | Users list |
| `/admin/categories` | Categories + sub-categories |
| `/admin/blogs` | Blog list |
| `/admin/blogs/create` | Create blog |
| `/admin/blogs/[id]` | Edit blog |
| `/admin/coupons` | Coupon management |
| `/admin/settings` | Site settings |
| `/admin/reports` | Sales reports |
| `/admin/support` | Support tickets |
| `/admin/announcements` | Marquee announcements |
| `/admin/pages` | Policy pages CMS |
| `/admin/hero` | Hero section |
| `/admin/about` | About Us CMS |

## Environment Variables (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:7500/api/v1
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_RAZORPAY_KEY=rzp_live_xxx
```

## public/ folder structure required
```
public/
  logo.png
  logo2.png
  og-image.jpg
  video/
    video-banner.mp4
```
Copy these from your old React project's `public/` folder.
