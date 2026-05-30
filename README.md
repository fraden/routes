This repo contains the source code of [eBike Routes](https://ebike.dennisfrankenbach.me/)

Written with Next.js, Typescript, Tailwind CSS, Mapbox GL, Turf.js
Parses gpx files and shows them on a map.

## Getting Started

First create a mapbox account and get an [access token](https://docs.mapbox.com/help/glossary/access-token/). Add it as `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` to a file called `.env.local`.

```
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=
```

Install dependencies

```bash
npm install
# or
yarn
```

Start the server with

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Routen synchronisieren

GPX-Dateien und Metadaten werden über das Python-Tool [python-komoot-gpx-creator](https://github.com/fraden/python-komoot-gpx-creator) von Komoot bezogen.

**Einmalig einrichten:**

```bash
cp .env.example .env
```

`.env` öffnen und ausfüllen:

```
KOMOOT_USERID=
KOMOOT_EMAIL=
KOMOOT_PW=
KOMOOT_SHOW_REAL_DATES=0
PYTHON_KOMOOT_PATH=/pfad/zum/python-komoot-gpx-creator
```

**Routen aktualisieren:**

```bash
yarn sync-routes
```

Das Script löscht die vorhandenen GPX-Dateien und `meta.js`, fetcht alle Touren von Komoot und kopiert die neuen Dateien ins Projekt.

## Troubleshooting

If you get an error like `fatal error: 'vips/vips8' file not found` you need to install the `vips` package.

```bash
brew install vips
```
