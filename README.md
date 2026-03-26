# Agricure Dashboard

A responsive agriculture dashboard with a Node backend and a modern `React + Vite + Tailwind` frontend.

## Run locally

```bash
npm install
npm run build
npm start
```

Then open `http://localhost:3000`.

## Frontend development

Run the backend and Vite dev server in separate terminals:

```bash
npm run dev:server
npm run dev
```

The Vite dev server runs on `http://localhost:5173` and proxies `/api/*` requests to the backend on `http://localhost:3000`.

## App install support

This project now includes Progressive Web App support:

- install from supported desktop and mobile browsers
- standalone app display with app metadata and icons
- offline shell caching for previously visited screens and static assets

For production app behavior, build the frontend first and serve it with `npm start`.

## Project structure

- `backend/server.js` for the Node server
- `backend/data.js` for dashboard and site data
- `src/` for the React application
- `dist/` for the built frontend assets

## Notes

- `npm start` serves the built React app from `dist/`
- run `npm run build` before `npm start`

## Deployment

- This repo includes a Vercel-compatible catch-all API function at [`api/[...route].js`](/Users/ritheeshreddy/Desktop/mandapam/api/[...route].js), so the frontend and backend can be deployed from the same project.
- If you deploy the frontend and backend separately, set `VITE_API_BASE_URL` to the live backend origin so frontend requests do not default to the current site.
- If the UI shows an HTML/JSON parsing error in production, it usually means `/api/*` is being served by the frontend host instead of the backend route.

## Backend endpoints

- `GET /api/site-data`
- `GET /api/dashboard`
- `PATCH /api/site-data`
- `POST /api/soil-reports`
- `POST /api/sensor-readings`
- `POST /api/preferences/language`

## Write payloads

### Update site settings

```json
{
  "title": "Dashboard",
  "subtitle": "Live agronomy insights for the current field",
  "profile": {
    "name": "Test User",
    "role": "Farm Manager",
    "farm": "Mandapam Demonstration Farm"
  }
}
```

### Save a soil report

```json
{
  "farmName": "North Field",
  "nitrogen": 18.2,
  "phosphorus": 45,
  "potassium": 37,
  "ph": 7.2,
  "electricalConductivity": 183,
  "soilMoisture": 22.7,
  "soilTemperature": 20.1,
  "organicMatter": 1.9
}
```

### Save sensor readings

```json
{
  "readings": [
    {
      "sensorName": "environment",
      "humidity": 63,
      "rootZoneTemperature": 20.1,
      "batteryReserve": 86,
      "packetsDelayed": 0.8,
      "uplinkLatency": 82
    },
    {
      "sensorName": "probeA",
      "moisture": 22.7
    }
  ]
}
```
