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
  const safe = String(name || "GUEST").substring(0, 9).toUpperCase();
  return `WELCOME TO THE\nGATHERING PLACE\n${safe} FAMILY`;
}

async function fetchGuest(guestId) {
  const res = await fetch(`https://api.ownerrez.com/v2/guests/${guestId}`, {
    headers: {
      "Authorization": authHeader(),
      "Accept": "application/json",
      "User-Agent": "vestaboard-script"
    }
  });
  const data = await res.json();
  console.log("Guest data:", JSON.stringify(data).substring(0, 200));
  return data;
}

async function checkBookings() {
  console.log("Checking bookings...");
  const now = new Date();
  const localDate = now.toLocaleDateString("en-CA", { timeZone: "America/Denver" });
  console.log("Checking for arrival date:", localDate);
  const url = `https://api.ownerrez.com/v2/bookings?property_ids=246664&include_guests=true`;
  try {
    const res = await fetch(url, {
      headers: {
        "Authorization": authHeader(),
        "Accept": "application/json",
        "User-Agent": "vestaboard-script"
      }
    });
    const data = await res.json();
    const bookings = data.items || data.results || [];
    console.log(`Total bookings fetched: ${bookings.length}`);
    const todayBooking = bookings.find(b => b.arrival === localDate && !b.is_block);
    if (!todayBooking) {
      console.log("No arrivals today.");
      return;
    }
    console.log("Arrival found, guest_id:", todayBooking.guest_id);
    const guest = await fetchGuest(todayBooking.guest_id);
    const name = guest.last_name || guest.first_name || "GUEST";
    console.log("Guest name:", name);
    const message = buildMessage(name);
    console.log("Message ready:", message.replace(/\n/g, " | "));
    if (message === lastMessage) { console.log("Already sent."); return; }
    if (VESTABOARD_TOKEN === "NOT_READY_YET") {
      console.log("Vestaboard not connected yet - message ready:", message);
      return;
    }
    await fetch("https://cloud.vestaboard.com/", {
      method: "POST",
      headers: { "X-Vestaboard-Token": VESTABOARD_TOKEN, "Content-Type": "application/json" },
      body: JSON.stringify({ text: message })
    });
    lastMessage = message;
    console.log("Sent to Vestaboard:", message.replace(/\n/g, " | "));
  } catch (err) {
    console.error("Error:", err.message);
  }
}

app.get("/", (_req, res) => res.send("Vestaboard script running ✅"));
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
setTimeout(() => checkBookings(), 3000);
setInterval(() => checkBookings(), 5 * 60 * 1000);
