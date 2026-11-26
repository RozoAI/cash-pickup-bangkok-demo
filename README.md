# Bangkok Cash Pickup

Estimate the stablecoin cost of a Thai baht cash pickup and compare nearby counters. This runnable example uses a fixed exchange rate, three sample counters, and a simulated traveler report. The report changes the recommendation when the closest counter has recently closed early.

With Node.js 24 or newer, run the example and tests from the repository root. No dependencies or credentials are required.

```sh
node demo.ts "pick up 2k baht"
npm test
```

The example prints a simulated USD estimate of 58.61 for 2,000 baht and suggests the second sample counter. It runs locally without contacting a provider or initiating a payment.

The amount parser accepts English and Thai currency labels. Prices use decimal arithmetic. Recommendations use the sample observation time so the example is reproducible.

[Cash Pickup](https://cash.rozo.ai) · [Telegram bot](https://t.me/RozoCashPickupBot)
