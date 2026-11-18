// Server-side price calculation. Mirrors src/assets/config.js (ydPrijs).
// The browser never decides the amount: Mollie gets the amount computed here.
// Prices excl. btw.

export const P = { dertig: 1650, maand: 995, beeld: 3000, termijn: 250, selectie: 495 };
export const BTW = 0.21;

export function berekenPrijs(k = {}) {
  const n = Math.max(1, Math.min(20, parseInt(k.aantal, 10) || 1));
  const door = k.looptijd === "doorlopend";
  const jaar = door && k.contract === "12";
  let once = 0;
  let month = 0;
  if (door) {
    let pm = P.maand;
    if (jaar) pm = pm - Math.round((pm * 2) / 12);
    month += n * pm;
  } else {
    once += n * P.dertig;
  }
  if (k.beeld === "wij") {
    if (door && (k.termijnen === true || k.termijnen === "ja")) month += P.termijn;
    else once += P.beeld;
  }
  if (k.selectie === "wij") {
    if (door) month += n * P.selectie;
    else once += n * P.selectie;
  }
  // Due now: everything one-off plus the first month.
  const nuExcl = once + month;
  const nuIncl = Math.round(nuExcl * (1 + BTW) * 100) / 100;
  return { n, door, jaar, once, month, nuExcl, nuIncl };
}
