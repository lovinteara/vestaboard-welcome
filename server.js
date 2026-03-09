import express from "express";

const app = express();

const OWNERREZ_EMAIL = process.env.OWNERREZ_EMAIL;
const OWNERREZ_PAT = process.env.OWNERREZ_PAT;
const VESTABOARD_TOKEN = process.env.VESTABOARD_TOKEN;

let lastMessage = "";

function authHeader() {
  const raw = `${OWNERREZ_EMAIL}:${OWNERREZ_PAT}`;
  return "Basic " + Buffer.from(raw).toString("base64");
}

function formatLine(text){
  return text.substring(0,15);
}

function buildMessage(name){

  name = name.substring(0,10).toUpperCase();

  return [
    formatLine(`WELCOME ${name}`),
    formatLine(`THE GATHERING`),
    formatLine(`PLACE`)
  ].join("\n");

}

async function sendVestaboard(text){

  await fetch("https://cloud.vestaboard.com/",{
    method:"POST",
    headers:{
      "X-Vestaboard-Token":VESTABOARD_TOKEN,
      "Content-Type":"application/json"
    },
    body:JSON.stringify({text})
  });

}

async function checkBookings(){

  const today = new Date();
  today.setHours(0,0,0,0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate()+1);

  const url =
`https://api.ownerrez.com/v2/bookings?arrival_from_utc=${today.toISOString()}&arrival_to_utc=${tomorrow.toISOString()}&include_guests=true`;

  const res = await fetch(url,{
    headers:{
      "Authorization":authHeader(),
      "Content-Type":"application/json",
      "User-Agent":"vestaboard-script"
    }
  });

  const data = await res.json();

  if(!data.results?.length) return;

  const guest = data.results[0].guest?.first_name || "GUEST";

  const message = buildMessage(guest);

  if(message === lastMessage) return;

  await sendVestaboard(message);

  lastMessage = message;

}

setInterval(checkBookings,300000);

checkBookings();

app.get("/",(req,res)=>{
  res.send("running");
});

app.listen(3000);
