# MarketNest

## Run locally

Requirements: Node.js 20.19 or newer and npm.

1. Install the client and server dependencies:

   ```sh
   npm run setup
   ```

2. Create `server/.env` from the example if it does not exist. In PowerShell:

   ```powershell
   if (!(Test-Path server\.env)) { Copy-Item server\.env.example server\.env }
   ```

   Set unique local values for `JWT_SECRET` and `JWT_REFRESH_SECRET`. Add Razorpay,
   Google, or Firebase credentials only when you want to use those integrations.
   In development, the server uses a local MongoDB connection when available and
   otherwise starts its persistent development database.

3. Start the API and web client together:

   ```sh
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173). The API health check is
   available at [http://localhost:5000/api/health](http://localhost:5000/api/health).
   Stop both processes with `Ctrl+C`.

The client and server can also be started separately with `npm run client` and
`npm run server`. Create a production client build with `npm run build`; run the
server integration test with `npm test`.
