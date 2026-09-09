# Business Notes · fictional example

Five days in London demonstrating a trip-local page module: a fixed agenda derived from daily meeting events, expenses grouped by currency, unknown amounts and budget kept visible, and receipt tracking stored only in the reader's browser. Company/personal classifications are illustrative; no meetings, payments or stays are booked.

```sh
npm run new -- business-trip
npm run dev
```

Open the Business page. Its implementation and validator live in `template/`; the root template supplies baseline pages. Copy the example and use `npm run template -- --trip trip` to create a fully editable renderer. See [extension instructions](../../docs/EXTENDING.md).

Original receipts, contacts, precise private meeting locations and company policies should be reviewed separately before any public release. A checked receipt does not mean it was submitted, approved or reimbursed.
