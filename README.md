# LOOP — Jev Shopping Assistant

A mobile-friendly donut shop demo built with React, TypeScript, and Jev. As you browse 20 fictional donuts, Jev decides whether to recommend a product, compare two products, ask a question, or stay quiet.

This is a prototype. The bag works only in the browser; there is no ordering or payment.

## Run locally

1. Install dependencies:

   ```sh
   npm ci
   ```

2. Create a `.env` file in the project root:

   ```env
   JEV_API_KEY=your_key_here
   ```

3. Start the app:

   ```sh
   npm run dev
   ```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

The local Vite proxy sends requests to the Jev API. The API key stays out of the browser bundle. The demo needs this proxy to use Jev; a static deployment alone is not enough.

## Try it

Browse donuts, enter a shopping wish, and see how the assistant responds. You can switch to a fixed recommendation view, inspect Jev's decisions, and add products to the local bag.

Browsing activity and your entered wish are sent to Jev when the input changes. The demo keeps its state in memory and clears it on reload.

## Check

```sh
npm test
npm run build
```
