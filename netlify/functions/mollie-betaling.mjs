// Creates a Mollie iDEAL payment for a vacancy order and returns the checkout URL.
// Needs the environment variable MOLLIE_API_KEY in Netlify (test_... to try, live_... for real).
// The order itself is already stored by Netlify Forms (form "vacature-bestelling") before this runs.

import { berekenPrijs } from "./lib/prijs.mjs";

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const kort = (v, max = 60) => String(v || "").replace(/\s+/g, " ").trim().slice(0, max);

export default async (req) => {
  if (req.method !== "POST") return json(405, { error: "method" });
  const key = process.env.MOLLIE_API_KEY;
  if (!key) return json(503, { error: "not-configured" });

  let k;
  try {
    k = await req.json();
  } catch {
    return json(400, { error: "body" });
  }

  const prijs = berekenPrijs(k);
  if (!(prijs.nuIncl > 0)) return json(400, { error: "amount" });

  const site = process.env.URL || new URL(req.url).origin;
  const omschrijving = `YoungDedicated: ${prijs.n} ${prijs.n > 1 ? "vacatures" : "vacature"}${
    prijs.door ? ", eerste maand, voorrang" : ", 30 dagen, voorrang"
  } | ${kort(k.bedrijf, 40)}`;

  const res = await fetch("https://api.mollie.com/v2/payments", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      amount: { currency: "EUR", value: prijs.nuIncl.toFixed(2) },
      description: omschrijving.slice(0, 255),
      method: "ideal",
      locale: "nl_NL",
      redirectUrl: `${site}/bedankt-bestelling/?betaling=ideal`,
      metadata: {
        bedrijf: kort(k.bedrijf),
        kvk: kort(k.kvk, 12),
        naam: kort(k.naam),
        email: kort(k.email, 120),
        functie: kort(k.functie),
        looptijd: prijs.door ? (prijs.jaar ? "doorlopend, jaarcontract" : "doorlopend, maandelijks") : "30 dagen",
        aantal: prijs.n,
        excl_btw: prijs.nuExcl,
        per_maand_excl_btw: prijs.month,
      },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?._links?.checkout?.href) {
    console.error("Mollie error", res.status, data?.detail || data?.title);
    return json(502, { error: "mollie" });
  }
  return json(200, { checkoutUrl: data._links.checkout.href, id: data.id, bedrag: prijs.nuIncl });
};

export const config = { path: "/api/betaling" };
