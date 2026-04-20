import express from "express";
const app = express();
const PORT = process.env.PORT || 3000;
const OWNERREZ_EMAIL = process.env.OWNERREZ_EMAIL;
const OWNERREZ_PAT = process.env.OWNERREZ_PAT;
const VESTABOARD_TOKEN = process.env.VESTABOARD_TOKEN;
let lastMessage = "";

function authHeader() {
  return "Basic " + Buffer.from(`${OWNERREZ_EMAIL}:${OWNERREZ_PAT}`).toString("base64");
}

function buildMessage(name) {
  const safe = String(name || "GUEST").substring(0, 7).toUpperCase();
  return `WELCOME ${safe}\nTHE GATHERING\nPLACE`;
}

async function checkBookings() {
  console.log("Checking bookings...");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const url = `https://api.ownerrez.com/v2/bookings?arrival_from_utc=${today.toISOString()}&arrival_to_utc=${tomorrow.toISOString()}&include_guests=true`;
  try {
    const res = await fetch(url, {
      headers: {
        "Authorization": authHeader(),
        "Accept": "application/json",
        "User-Agent": "vestaboard-script"
      }
    });
    const data = await res.json();
    const bookings = data.results || [];
    console.log(`Found ${bookings.length} arrival(s) today.`);
    if (!bookings.length) return;
    const name = bookings[0]?.guest?.first_name || "GUEST";
    const message = buildMessage(name);
    if (message === lastMessage) { console.log("Already sent."); return; }
    if (VESTABOARD_TOKEN === "NOT_READY_YET") { console.log("Vestaboard not connected yet - message ready:", message); return; }
    await fetch("https://cloud.vestaboard.com/", {
      method: "POST",
      headers: { "X-Vestaboard-Token": VESTABOARD_TOKEN, "Content-Type": "application/json" },
      body: JSON.stringify({ text: message })
    });
    lastMessage = message;
    console.log("Sent to Vestaboard:", message);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

app.get("/", (_req, res) => res.send("Vestaboard script running ✅"));
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
setTimeout(() => checkBookings(), 3000);
setInterval(() => checkBookings(), 5 * 60 * 1000);
