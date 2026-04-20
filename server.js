import express from "express";

const app = express();

const OWNERREZ_EMAIL = process.env.OWNERREZ_EMAIL;
const OWNERREZ_PAT = process.env.OWNERREZ_PAT;
const VESTABOARD_TOKEN = process.env.VESTABOARD_TOKEN;
const PORT = process.env.PORT || 3000;

let lastMessage = "";

function authHeader() {
  const raw = `${OWNERREZ_EMAIL}:${OWNERREZ_PAT}`;
  return "Basic " + Buffer.from(raw).toString("base64");
}

function buildMessage(name) {
  const safeName = String(name || "GUEST").substring(0, 7).toUpperCase();
  const line1 = `WELCOME ${safeName}`.substring(0, 15);
  const line2 = "THE GATHERING";
  const line3 = "PLACE";
  return `${line1}\n${line2}\n${line3}`;
}

async function sendVestaboard(text) {
  console.log("Sending to Vestaboard:", text.replace(/\n/g, " | "));
  if (VESTABOARD_TOKEN === "NOT_READY_YET") {
    console.log("Vestaboard token not set yet - skipping send.");
    return;
  }
  const res = await fetch("https://cloud.vestaboard.com/", {
    method: "POST",
    headers: {
      "X-Vestaboard-Token": VESTABOARD_TOKEN,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text })
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Vestaboard error: ${res.status} ${body}`);
  }
}

async function checkBookings() {
  console.log("Checking OwnerRez bookings...");
  if (!OWNERREZ_EMAIL || !OWNERREZ_PAT) {
    console.log("Missing OwnerRez credentials.");
    return;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const url = `https://api.ownerrez.com/v2/bookings?arrival_from_utc=${encodeURIComponent(today.toISOString())}&arrival_to_utc=${encodeURIComponent(tomorrow.toISOString())}&include_guests=true`;
  try {
    const res = await fetch(url, {
      headers: {
        "Authorization": authHeader(),
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "vestaboard-note-script"
      }
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`OwnerRez error: ${res.status} ${body}`);
      return;
    }
    const data = await res.json();
    const bookings = data.results || [];
    console.log(`Found ${bookings.length} arrival(s) today.`);
    if (!bookings.length) return;
    const guestName = bookings[0]?.guest?.first_name || "GUEST";
    const message = buildMessage(guestName);
    if (message === lastMessage) {
      console.log("Already sent this message.");
      return;
    }
    await sendVestaboard(message);
    lastMessage = message;
  } catch (err) {
    console.error("Error checking bookings:", err.message);
  }
}

app.get("/", (_req, res) => {
  res.send("Vestaboard welcome script running");
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

setTimeout(() => checkBookings(), 3000);
setInterval(() => checkBookings(), 5 * 60 * 1000);
