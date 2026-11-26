import { parseAmount, amountErrorMessage } from "./src/bot/amount.ts";
import { mul, parseDec, round, toStr } from "./src/pricing/decimal.ts";
import { recommend } from "./src/locations/recommend.ts";
import { locationsFixture, quoteFixture } from "./fixtures/index.ts";

const amount = parseAmount(process.argv.slice(2).join(" ") || "1000 baht");
if (!amount.ok) {
  console.error(amountErrorMessage(amount.reason));
  process.exitCode = 1;
} else {
  const rate = parseDec(quoteFixture.estimates[0].fx.price);
  const usd = round(mul(parseDec(String(amount.thb)), rate), 2);
  console.log(`Simulated estimate for ฿${amount.thb}: USD ${toStr(usd)}`);
  const { branches, observations, generatedAt } = locationsFixture;
  const choice = recommend(branches, observations, Date.parse(generatedAt));
  if (choice) console.log(choice.reason);
}
