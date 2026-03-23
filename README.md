# Agricure Dashboard

A responsive agriculture dashboard with a dedicated `backend/` folder and a cleaner frontend.

## Run locally

```bash
npm start
```

Then open `http://localhost:3000`.

## Project structure

- `backend/server.js` for the Node server
- `backend/data.js` for dashboard and site data
- `public/` for the frontend files

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
