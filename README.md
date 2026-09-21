# AjoLedger

> **Sandbox mode: no real money moves.**

A tamper-evident rotating savings circle platform — built for ajo, esusu, and susu groups.

## What it does

AjoLedger replaces WhatsApp screenshots and notebooks with a shared, append-only ledger every member can verify — and a Reliability Score you can share as proof of saving discipline.

## Stack

| Layer | Tech |
|-------|------|
| Server | Node 20, Express 4, Mongoose 8, MongoDB Atlas |
| Client | React 18, Vite, Tailwind CSS v3 |
| Payments | Paystack (test mode) |
| Hosting | Vercel (client) + Render (server) |

## Local Development

```bash
# Server
cd server
cp .env.example .env    # fill in your values
npm install
npm run dev             # port 3000

# Client
cd client
cp .env.example .env    # VITE_API_URL=http://localhost:3000/api
npm install
npm run dev             # port 5173
```

## Testing

```bash
cd server
npm test
```

## Deployment

See [docs/DEPLOY.md](docs/DEPLOY.md) for step-by-step deployment instructions.

