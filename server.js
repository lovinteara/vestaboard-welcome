import express from "express";
const app = express();
const PORT = process.env.PORT || 3000;
const OWNERREZ_EMAIL = process.env.OWNERREZ_EMAIL;
const OWNERREZ_PAT = process.env.OWNERREZ_PAT;
const VESTABOARD_TOKEN = process.env.VESTABOARD_TOKEN;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const NPS_API_KEY = process.env.NPS_API_KEY;
const PROPERTY_ID = "246664";
const WIFI_NAME = "     TGP       ";
const WIFI_PASS = "CASCADE4139";
let lastMessage = "";
let currentGuest = null;
let weatherRotationIndex = 0;
let npsRotationIndex = 0;

function authHeader() {
  return "Basic " + Buffer.from(`${OWNERREZ_EMAIL}:${OWNERREZ_PAT}`).toString("base64");
}

function buildWelcomeMessage(lastName) {
  const safe = String(lastName || "GUEST").substring(0, 11).toUpperCase();
  return `WELCOME TO THE\nGATHERING PLACE\n${safe} FAM`;
}

function buildCheckoutMessage(firstName) {
  const safe = String(firstName || "GUEST").substring(0, 11).toUpperCase();
  return `THANK YOU\n${safe} FAM\nSEE YOU AGAIN!`;
}

function buildWeatherMessage(weather) {
  const day = new Date().toLocaleDateString("en-US", {
    timeZone: "America/Denver",
    weekday: "short",
    month: "short",
    day: "numeric"
  }).toUpperCase();

  const line1 = weather.name.padEnd(15).substring(0, 15);
  const line2 = String(weather.description || "").toUpperCase().padEnd(15).substring(0, 15);
  const high = Math.round(weather.high);
  const low = Math.round(weather.low);
  const line3 = `${day} ${high}F/${low}F`.padEnd(15).substring(0, 15);

  return `${line1}\n${line2}\n${line3}`;
}

function buildWifiMessage() {
  return `WIFI INFO\n${WIFI_NAME}\n${WIFI_PASS}`;
}

async function fetchGuest(guestId) {
  const res = await fetch(`https://api.ownerrez.com/v2/guests/${guestId}`, {
    headers: { "Authorization": authHeader(), "Accept": "application/json", "User-Agent": "vestaboard-script" }
  });
  return res.json();
}

const LOCATIONS = [
  { name: "ISLAND PARK ID",  query: "Island Park,Idaho,US" },
  { name: "W YELLOWSTN MT",  query: "West Yellowstone,Montana,US" },
  { name: "GARDINER MT",     query: "Gardiner,Montana,US" },
  { name: "JACKSON HOLE WY", query: "Jackson,Wyoming,US" },
  { name: "CODY WY",         query: "Cody,Wyoming,US" },
  { name: "IDAHO FALLS IDA", query: "Idaho Falls,Idaho,US" },
  { name: "SALT LAKE CITY",  query: "Salt Lake City,Utah,US" },
  { name: "BOZEMAN BZN",     query: "Bozeman,Montana,US" },
];

const NPS_PARKS = [
  { code: "yell", name: "YELLOWSTONE" },
  { code: "grte", name: "GRAND TETON" },
];

async function fetchWeatherForLocation(location) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location.query)}&appid=${WEATHER_API_KEY}&units=imperial`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    const data = await res.json();
    return {
      name: location.name,
      description: data.weather?.[0]?.description || "CLEAR",
      high: data.main?.temp_max || data.main?.temp || 50,
      low: data.main?.temp_min || data.main?.temp || 35
    };
  } catch (err) {
    console.error(`Weather fetch error for ${location.name}:`, err.message);
    return null;
  }
}

async function fetchAllWeather() {
  const results = await Promise.all(LOCATIONS.map(fetchWeatherForLocation));
  return results.filter(r => r !== null);
}

async function fetchNPSAlerts(park) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `https://developer.nps.gov/api/v1/alerts?parkCode=${park.code}&limit=1&api_key=${NPS_API_KEY}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    const data = await res.json();
    const alert = data.data?.[0];
    if (!alert) return null;

    const line1 = `${park.name} NPS`.padEnd(15).substring(0, 15);
    const line2 = String(alert.title || "").toUpperCase().padEnd(15).substring(0, 15);
    const line3 = String(alert.description || "").toUpperCase().padEnd(15).substring(0, 15);

    return `${line1}\n${line2}\n${line3}`;
  } catch (err) {
    console.error(`NPS alert fetch error for ${park.name}:`, err.message);
    return null;
  }
}

async function fetchNPSFees(park) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `https://developer.nps.gov/api/v1/feespasses?parkCode=${park.code}&api_key=${NPS_API_KEY}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    const data = await res.json();
    const fees = data.data?.[0]?.fees || [];

    const usFee = fees.find(f => f.title.toLowerCase().includes("per vehicle") && !f.title.toLowerCase().includes("non"));
    const intlFee = fees.find(f => f.title.toLowerCase().includes("non"));

    if (!usFee) return null;

    const line1 = `${park.name} FEE`.padEnd(15).substring(0, 15);
    const line2 = `US VEH $${usFee.cost}`.padEnd(15).substring(0, 15);
    const line3 = intlFee
      ? `INTL VEH $${intlFee.cost}`.padEnd(15).substring(0, 15)
      : "7 DAY PASS     ";

    return `${line1}\n${line2}\n${line3}`;
  } catch (err) {
    console.error(`NPS fee fetch error for ${park.name}:`, err.message);
    return null;
  }
}

async function fetchAllNPS() {
  const alerts = await Promise.all(NPS_PARKS.map(fetchNPSAlerts));
  const fees = await Promise.all(NPS_PARKS.map(fetchNPSFees));
  return [...alerts, ...fees].filter(r => r !== null);
}

async function sendToVestaboard(text) {
  if (!VESTABOARD_TOKEN || VESTABOARD_TOKEN === "NOT_READY_YET") {
    console.log("Vestaboard not connected yet - message ready:", text.replace(/\n/g, " | "));
    return;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  await fetch("https://cloud.vestaboard.com/", {
    method: "POST",
    headers: { "X-Vestaboard-Token": VESTABOARD_TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal: controller.signal
  });
  clearTimeout(timeout);
  console.log("Sent to Vestaboard:", text.replace(/\n/g, " | "));
}

async function checkBookings() {
  console.log("Checking bookings...");
  const now = new Date();
  const localDate = now.toLocaleDateString("en-CA", { timeZone: "America/Denver" });
  const localHour = parseInt(now.toLocaleString("en-US", { timeZone: "America/Denver", hour: "numeric", hour12: false }));
  console.log(`Local date: ${localDate} | Local hour: ${localHour}`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://api.ownerrez.com/v2/bookings?property_ids=${PROPERTY_ID}&include_guests=true`, {
      headers: { "Authorization": authHeader(), "Accept": "application/json", "User-Agent": "vestaboard-script" },
      signal: controller.signal
    });
    clearTimeout(timeout);
    const data = await res.json();
    const bookings = data.items || data.results || [];

    const todayArrival = bookings.find(b => b.arrival === localDate && !b.is_block);
    const todayDeparture = bookings.find(b => b.departure === localDate && !b.is_block);

    // CHECKOUT: 10am-3pm on departure day
    if (todayDeparture && localHour >= 10 && localHour < 15) {
      const guest = await fetchGuest(todayDeparture.guest_id);
      currentGuest = guest;
      const message = buildCheckoutMessage(guest.first_name);
      if (message !== lastMessage) {
        await sendToVestaboard(message);
        lastMessage = message;
      }
      return;
    }

    // WELCOME: 3pm onwards on arrival day
    if (todayArrival && localHour >= 15) {
      const guest = await fetchGuest(todayArrival.guest_id);
      currentGuest = guest;
      const message = buildWelcomeMessage(guest.last_name);
      if (message !== lastMessage) {
        await sendToVestaboard(message);
        lastMessage = message;
      }
      return;
    }

    // BETWEEN GUESTS: rotate weather, NPS, and wifi
    console.log("No active guest period - showing weather, NPS, or wifi.");
    const rand = Math.random();

    if (rand < 0.2) {
      // 20% wifi
      const message = buildWifiMessage();
      if (message !== lastMessage) {
        await sendToVestaboard(message);
        lastMessage = message;
      }
    } else if (rand < 0.4) {
      // 20% NPS
      const allNPS = await fetchAllNPS();
      if (allNPS.length > 0) {
        const message = allNPS[npsRotationIndex % allNPS.length];
        npsRotationIndex++;
        if (message !== lastMessage) {
          await sendToVestaboard(message);
          lastMessage = message;
        }
      }
    } else {
      // 60% weather
      const allWeather = await fetchAllWeather();
      if (allWeather.length > 0) {
        const weather = allWeather[weatherRotationIndex % allWeather.length];
        weatherRotationIndex++;
        const message = buildWeatherMessage(weather);
        if (message !== lastMessage) {
          await sendToVestaboard(message);
          lastMessage = message;
        }
      }
    }

  } catch (err) {
    console.error("Error:", err.message);
  }
}

async function morningWeather() {
  console.log("8am weather display...");
  const allWeather = await fetchAllWeather();
  if (allWeather.length > 0) {
    weatherRotationIndex = 0;
    const message = buildWeatherMessage(allWeather[0]);
    await sendToVestaboard(message);
    lastMessage = message;
  }
}

// Check every 5 minutes
setTimeout(() => checkBookings(), 3000);
setInterval(() => checkBookings(), 5 * 60 * 1000);

// 8am weather check daily (Mountain Time = UTC-6/7)
setInterval(() => {
  const now = new Date();
  const localHour = parseInt(now.toLocaleString("en-US", { timeZone: "America/Denver", hour: "numeric", hour12: false }));
  const localMin = now.getMinutes();
  if (localHour === 8 && localMin < 5) {
    morningWeather();
  }
}, 60 * 1000);

app.get("/", (_req, res) => res.send("Vestaboard script running ✅"));
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));  const line1 = weather.name.padEnd(15).substring(0, 15);
  const line2 = String(weather.description || "").toUpperCase().padEnd(15).substring(0, 15);
  const high = Math.round(weather.high);
  const low = Math.round(weather.low);
  const line3 = `${day} ${high}F/${low}F`.padEnd(15).substring(0, 15);

  return `${line1}\n${line2}\n${line3}`;
}

function buildWifiMessage() {
  return `WIFI INFO\n${WIFI_NAME}\n${WIFI_PASS}`;
}

async function fetchGuest(guestId) {
  const res = await fetch(`https://api.ownerrez.com/v2/guests/${guestId}`, {
    headers: { "Authorization": authHeader(), "Accept": "application/json", "User-Agent": "vestaboard-script" }
  });
  return res.json();
}

const LOCATIONS = [
  { name: "ISLAND PARK ID",   query: "Island Park,Idaho,US" },
  { name: "W YELLOWSTN MT",   query: "West Yellowstone,Montana,US" },
  { name: "GARDINER MT",      query: "Gardiner,Montana,US" },
  { name: "JACKSON HOLE WY",  query: "Jackson,Wyoming,US" },
  { name: "CODY WY",          query: "Cody,Wyoming,US" },
  { name: "IDAHO FALLS IDA",  query: "Idaho Falls,Idaho,US" },
  { name: "SALT LAKE CITY",   query: "Salt Lake City,Utah,US" },
  { name: "BOZEMAN BZN",      query: "Bozeman,Montana,US" },
];

async function fetchWeatherForLocation(location) {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location.query)}&appid=${WEATHER_API_KEY}&units=imperial`
    );
    const data = await res.json();
    return {
      name: location.name,
      description: data.weather?.[0]?.description || "CLEAR",
      high: data.main?.temp_max || data.main?.temp || 50,
      low: data.main?.temp_min || data.main?.temp || 35
    };
  } catch (err) {
    console.error(`Weather fetch error for ${location.name}:`, err.message);
    return null;
  }
}

async function fetchAllWeather() {
  const results = await Promise.all(LOCATIONS.map(fetchWeatherForLocation));
  return results.filter(r => r !== null);
}

async function sendToVestaboard(text) {
  if (!VESTABOARD_TOKEN || VESTABOARD_TOKEN === "NOT_READY_YET") {
    console.log("Vestaboard not connected yet - message ready:", text.replace(/\n/g, " | "));
    return;
  }
  await fetch("https://cloud.vestaboard.com/", {
    method: "POST",
    headers: { "X-Vestaboard-Token": VESTABOARD_TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });
  console.log("Sent to Vestaboard:", text.replace(/\n/g, " | "));
}

async function checkBookings() {
  console.log("Checking bookings...");
  const now = new Date();
  const localDate = now.toLocaleDateString("en-CA", { timeZone: "America/Denver" });
  const localHour = parseInt(now.toLocaleString("en-US", { timeZone: "America/Denver", hour: "numeric", hour12: false }));
  console.log(`Local date: ${localDate} | Local hour: ${localHour}`);

  try {
    const res = await fetch(`https://api.ownerrez.com/v2/bookings?property_ids=${PROPERTY_ID}&include_guests=true`, {
      headers: { "Authorization": authHeader(), "Accept": "application/json", "User-Agent": "vestaboard-script" }
    });
    const data = await res.json();
    const bookings = data.items || data.results || [];

    const todayArrival = bookings.find(b => b.arrival === localDate && !b.is_block);
    const todayDeparture = bookings.find(b => b.departure === localDate && !b.is_block);

    // CHECKOUT: 10am-3pm on departure day
    if (todayDeparture && localHour >= 10 && localHour < 15) {
      const guest = await fetchGuest(todayDeparture.guest_id);
      currentGuest = guest;
      const message = buildCheckoutMessage(guest.first_name);
      if (message !== lastMessage) {
        await sendToVestaboard(message);
        lastMessage = message;
      }
      return;
    }

    // WELCOME: 3pm onwards on arrival day
    if (todayArrival && localHour >= 15) {
      const guest = await fetchGuest(todayArrival.guest_id);
      currentGuest = guest;
      const message = buildWelcomeMessage(guest.last_name);
      if (message !== lastMessage) {
        await sendToVestaboard(message);
        lastMessage = message;
      }
      return;
    }

    // BETWEEN GUESTS: rotate weather and wifi randomly
    console.log("No active guest period - showing weather or wifi.");
    const showWifi = Math.random() < 0.3;
    if (showWifi) {
      const message = buildWifiMessage();
      if (message !== lastMessage) {
        await sendToVestaboard(message);
        lastMessage = message;
      }
    } else {
      const allWeather = await fetchAllWeather();
      if (allWeather.length > 0) {
        const weather = allWeather[weatherRotationIndex % allWeather.length];
        weatherRotationIndex++;
        const message = buildWeatherMessage(weather);
        if (message !== lastMessage) {
          await sendToVestaboard(message);
          lastMessage = message;
        }
      }
    }

  } catch (err) {
    console.error("Error:", err.message);
  }
}

async function morningWeather() {
  console.log("8am weather display...");
  const allWeather = await fetchAllWeather();
  if (allWeather.length > 0) {
    weatherRotationIndex = 0;
    const message = buildWeatherMessage(allWeather[0]);
    await sendToVestaboard(message);
    lastMessage = message;
  }
}

// Check every 5 minutes
setTimeout(() => checkBookings(), 3000);
setInterval(() => checkBookings(), 5 * 60 * 1000);

// 8am weather check daily (Mountain Time = UTC-6/7)
setInterval(() => {
  const now = new Date();
  const localHour = parseInt(now.toLocaleString("en-US", { timeZone: "America/Denver", hour: "numeric", hour12: false }));
  const localMin = now.getMinutes();
  if (localHour === 8 && localMin < 5) {
    morningWeather();
  }
}, 60 * 1000);

app.get("/", (_req, res) => res.send("Vestaboard script running ✅"));
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
