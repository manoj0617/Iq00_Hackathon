# Storage Intelligence demo

An interactive browser simulation of an evidence-led storage cleanup workflow. It uses sample metadata and never accesses or deletes device files.

## Run locally

The machine's default `npm` launcher may be misconfigured. On this workspace, use the installed npm CLI directly when needed:

```powershell
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" install
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run dev
```

Open `http://127.0.0.1:4173`.

## Deploy to Vercel

The project is configured as a Vite SPA in `vercel.json`. Vercel installs from `package-lock.json`, builds with Node 22 using `npm run build`, and publishes `dist`. No environment variables are required.

From the Vercel dashboard, import the repository and deploy with the detected settings. Keep the project root at the repository root; the checked-in configuration supplies the framework, build command, output directory and SPA fallback.

With the Vercel CLI:

```powershell
npx vercel
npx vercel --prod
```

The first command creates a preview deployment. Run the production command only after reviewing that preview.

## Verification

```powershell
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" test
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run build
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run preview
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run test:e2e
```

Use the in-app **Reset demo** action before a presentation rehearsal. All values are illustrative fixture metadata; cleanup changes only the demo's browser storage.
