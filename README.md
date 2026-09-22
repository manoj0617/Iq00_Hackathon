# Storage Intelligence demo

An interactive browser simulation of an evidence-led storage cleanup workflow. It uses sample metadata and never accesses or deletes device files.

## Run locally

The machine's default `npm` launcher may be misconfigured. On this workspace, use the installed npm CLI directly when needed:

```powershell
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" install
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run dev
```

Open `http://127.0.0.1:4173`.

## Verification

```powershell
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" test
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run build
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run test:e2e
```

Use the in-app **Reset demo** action before a presentation rehearsal. All values are illustrative fixture metadata; cleanup changes only the demo's browser storage.
