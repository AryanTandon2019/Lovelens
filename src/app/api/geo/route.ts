// The visitor's country, from the header Vercel adds to every request at the edge (no third-party lookup, no IP
// stored). Used to pick the price and checkout: India gets the INR checkout, everyone else the USD one.
export async function GET(request: Request) {
  const country = (request.headers.get("x-vercel-ip-country") || "").toUpperCase();
  return Response.json({ country }, { headers: { "Cache-Control": "private, no-store" } });
}
