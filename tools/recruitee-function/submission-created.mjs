// Runs automatically on every Netlify Forms submission.
// Application forms are forwarded to the matching vacancy in Recruitee
// (public careers-site API). The submission also stays in Netlify (Site > Forms).
//
// New vacancy? Add one line to OFFERS: "<form name>": "<recruitee offer slug>".
// The slug is visible at https://youngdedicated.recruitee.com/api/offers/

const COMPANY = "youngdedicated";

const OFFERS = {
  "sollicitatie-medewerker-incidentbestrijding": "medewerker-incidentbestrijding-rotterdam",
  "sollicitatie-servicetechnicus-randstad": "servicetechnicus-randstad-1",
  "sollicitatie-sales-recruiter-bunnik": "recruiter-bunnik",
  "sollicitatie-montagemonteur-rhenen": "montagemonteur-kachelspecialist-rhenen",
};

const pick = (data, ...needles) => {
  for (const [key, value] of Object.entries(data)) {
    if (needles.some((n) => key.toLowerCase().includes(n)) && value) return value;
  }
  return "";
};

const fileOf = (data) => {
  for (const value of Object.values(data)) {
    if (value && typeof value === "object" && value.url) return value;
  }
  return null;
};

export const handler = async (event) => {
  const { payload } = JSON.parse(event.body);
  const formName = payload.form_name || payload.data?.["form-name"];
  const slug = OFFERS[formName];
  if (!slug) return { statusCode: 200, body: "geen Recruitee-koppeling voor " + formName };

  const data = payload.data || {};
  const body = new FormData();
  body.append("candidate[name]", pick(data, "naam", "name") || "Onbekend");
  const email = pick(data, "email");
  if (email) body.append("candidate[emails][]", email);
  const phone = pick(data, "telef", "phone");
  if (phone) body.append("candidate[phones][]", phone);
  const motivation = pick(data, "motiv", "bericht", "toelichting");
  if (motivation) body.append("candidate[cover_letter]", motivation);

  const file = fileOf(data);
  if (file) {
    const res = await fetch(file.url);
    if (res.ok) {
      body.append("candidate[cv]", new Blob([await res.arrayBuffer()], { type: file.type || "application/octet-stream" }), file.filename || "cv");
    }
  }

  const res = await fetch(`https://${COMPANY}.recruitee.com/api/offers/${slug}/candidates`, { method: "POST", body });
  const text = await res.text();
  console.log(`Recruitee ${slug}: ${res.status} ${text.slice(0, 300)}`);
  return { statusCode: res.ok ? 200 : 502, body: `Recruitee ${res.status}` };
};
