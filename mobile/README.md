# KANTIN mobile starter · Meetings 8–10

One Expo app (React Native + TypeScript, Expo SDK 58) that grows across the three
mobile meetings. Setup instructions for students are in the Meeting 8 setup sheet
(`slides/handout-08-setup.pdf`).

```bash
npm install
npx expo start          # scan the QR code with Expo Go on your phone
npm run test:queue      # the offline queue tests, in Node (Meeting 10)
```

## What is where

| Path | Meeting | What it is |
|---|---|---|
| `App.tsx` | 8 | Shows one step; change the import line to switch step |
| `src/steps/Step1Hello.tsx` … `Step4MenuFromApi.tsx` | 8 | The live build: text, state, a list, the real `GET /v1/menu-items` |
| `src/config.ts` | 8 | `API_BASE_URL` — point it at your own group's backend |
| `src/screens/useDeliveryScreen.ts` | 9 | A state holder as a React hook: events up, state down |
| `src/data/deliveries.ts` | 9–10 | The repository; `markDelivered` = two writes, one transaction |
| `src/data/transport.ts` | 9–10 | The seam: `HttpTransport` and `FaultyTransport` |
| `src/data/queue.ts` | 10 | Enqueue, classify, backoff with jitter, per-entity drain |
| `src/data/index.ts` | 9 | The composition root: the only place that picks implementations |
| `test/queue.test.mts` | 10 | Lost reply, restart mid-flight, one stuck lane |

## What your group does for Tugas P6, one step per meeting

The full brief is `assignments/TUGAS-P6_Kelompok-Klien-Mobile-dan-Sinkronisasi-Offline.md`.

1. **Meeting 8 · set up** (`l6-1`). Copy this folder into your group repository as
   `mobile/`, point `API_BASE_URL` in `src/config.ts` at your deployed service, and
   build `src/screens/<Entity>ListScreen.tsx` from `Step4MenuFromApi.tsx`, with all
   four view states.
2. **Meeting 9 · design pattern and accessibility** (`l6-2`). Split that screen into
   a screen, a state holder (`use<X>Screen.ts`, like `useDeliveryScreen.ts`), a
   repository and the transport, wired in `src/data/index.ts`. No `fetch()` in
   `src/screens`. Run the four accessibility checks and fix what fails.
3. **Meeting 10 · work offline** (`l6`). Adapt the queue to one write action of your
   own; each place is marked `TODO (your group)`:
   - `ROUTES` in `transport.ts` — one entry per operation, from your `openapi.yaml`;
   - `classify` in `queue.ts` — the permanent refusals your contract documents;
   - `settle` in `deliveries.ts` — your conflict policy, and revert-and-tell for a
     permanent refusal;
   - `local_deliveries` in `db.ts` — rename to your own entity.

   Then extend `test/queue.test.mts` towards the minimum test set in the brief. The
   screen and state holder from step 2 must not change.
