# GUI Agent Oversight Experiment Website

This is a dependency-free static site for participant experiments.

## How it works

The URL accepts:

- `pid`: participant ID
- `step`: optional step number

Example URLs:

- `http://localhost:8000/?pid=P001`
- `http://localhost:8000/?pid=P001&step=3`

The participant flow is resolved from [`data/experiment-config.csv`](/Users/chaoranchen/Documents/GitHub/oversight-experiment-websites/data/experiment-config.csv).

Each row defines one participant:

- `pid`
- `step_1_page` to `step_6_page`
- `step_1_instruction` to `step_6_instruction`

This means:

- As long as the `pid` is fixed, the page order is fixed.
- The first instruction shown on each step is also fixed.

## Files to edit

- [`data/experiment-config.csv`](/Users/chaoranchen/Documents/GitHub/oversight-experiment-websites/data/experiment-config.csv): participant-specific page order and instruction order
- [`src/content.js`](/Users/chaoranchen/Documents/GitHub/oversight-experiment-websites/src/content.js): page content and instruction text libraries

## Run locally

Because the browser needs to fetch the CSV file, run a local static server instead of opening `index.html` directly:

```bash
python3 -m http.server 8000
```

Then open:

```bash
http://localhost:8000/?pid=P001
```

## Export Firebase data

Participant questionnaire data is written to Firestore under `participants/{pid}`. To export it, use the Admin SDK script in [`scripts/export-firebase-data.mjs`](/Users/chaoranchen/Documents/GitHub/oversight-experiment-websites/scripts/export-firebase-data.mjs).

1. Install the Admin SDK locally:

```bash
npm install firebase-admin
```

2. Download a Firebase service account JSON from the Firebase or Google Cloud console.

3. Run the export:

```bash
node scripts/export-firebase-data.mjs --service-account /path/to/service-account.json
```

`/path/to/service-account.json` is a placeholder. Replace it with the actual local path to your downloaded Firebase service account JSON, for example:

```bash
node scripts/export-firebase-data.mjs --service-account /Users/chaoranchen/Downloads/agent-oversight-firebase-adminsdk-fbsvc-2dc50040a0.json
```

This writes both JSON and CSV exports to the `exports/` directory by default.
