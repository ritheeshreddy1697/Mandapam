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

## Project structure

- `backend/server.js` for the Node server
- `backend/data.js` for dashboard and site data
- `src/` for the React application
- `dist/` for the built frontend assets

## Notes

- `npm start` serves the built React app from `dist/`
- run `npm run build` before `npm start`

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
