# Crate

A small, full-stack demo storefront for thoughtful everyday goods. The client is React + Vite; the API is Node.js + Express. Orders are kept in memory for the lifetime of the server and **no payment is collected**.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Run locally

```sh
npm install
npm run dev
```

Open the Vite URL printed by the client (usually `http://localhost:5173`). The API runs on `http://localhost:3001`; Vite proxies `/api` requests to it.

## Production build

```sh
npm run build
npm start
```

`npm start` runs the API. Serve the generated `dist/` directory from a static host and point `/api` requests to the API server to run the built client in production. The API listens on port `3001` by default; set `PORT` to choose another port.

## API

- `GET /api/health` — API health status
- `GET /api/products` — seeded product catalog
- `POST /api/orders` — validates customer and cart data, then creates an in-memory demo order using server-side product prices

Order requests contain `customer` (`name`, `email`) and `items` (`productId`, `quantity`). The catalog and order data are sample data; orders are not persisted after a server restart.

## Tests

```sh
npm test
```
