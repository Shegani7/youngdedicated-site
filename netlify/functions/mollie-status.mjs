// Returns the status of a Mollie payment, so /bedankt-bestelling/ can say whether it went through.
// Only returns the status and amount, nothing personal.

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export default async (req) => {
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!/^tr_[A-Za-z0-9]{6,20}$/.test(id)) return json(400, { error: "id" });
  const key = process.env.MOLLIE_API_KEY;
  if (!key) return json(503, { error: "not-configured" });

  const res = await fetch(`https://api.mollie.com/v2/payments/${id}`, {
    headers: { authorization: `Bearer ${key}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return json(502, { error: "mollie" });
  return json(200, {
    status: data.status,
    bedrag: data.amount?.value,
    checkoutUrl: data.status === "open" ? data._links?.checkout?.href : undefined,
  });
};

export const config = { path: "/api/betaling-status" };
