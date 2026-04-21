import express from "express";
import twilio from "twilio";

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const PORT = process.env.PORT || 3000;
const OWNERREZ_EMAIL = process.env.OWNERREZ_EMAIL;
const OWNERREZ_PAT = process.env.OWNERREZ_PAT;
const VESTABOARD_TOKEN = process.env.VESTABOARD_TOKEN;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const NPS_API_KEY = process.env.NPS_API_KEY;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;
const TWILIO_TO_NUMBER = process.env.TWILIO_TO_NUMBER;
const PROPERTY_ID = "246664";
const WIFI_NAME = "     TGP       ";
const WIFI_PASS = "CASCADE4139";

let lastMessage = "";
let currentGuest = null;
let nextArrivalDate = null;
let weatherRotationIndex = 0;
let npsRotationIndex = 0;
let quoteRotationIndex = 0;
let quoteQueue = [];
let overrideUntil = null;

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const QUOTES = [
  "LOOK FOR THE\nBARE NECESSITIES\nFORGET YR STRIFE",
  "GET UP GET OUT\nAND RIDE THE\nPOWDER TODAY",
  "COLD AIR\nFULL TANK\nCLEAR MIND",
  "WAKE PRAY\nRIDE REPEAT\nALL DAY",
  "WHEN IN DOUBT\nTHROTTLE\nOUT",
  "WORK HARD\nRIDE HARDER\nALWAYS",
  "RISE UP\nSUIT UP\nSEND IT",
  "CHASE SNOW\nNOT EXCUSES\nTODAY",
  "GO WHERE THE\nTRAIL\nTAKES YOU",
  "SNOW DUST AND\nHUSTLE\nBABY",
  "FUEL YOUR SOUL\nONE RIDE\nAT A TIME",
  "THE MOUNTAINS\nARE CALLING\nLET US GO",
  "BORN TO RIDE\nFORCED\nTO WORK",
  "MAKE TODAY\nLOUD FAST\nAND FUN",
  "START THE DAY\nWIDE OPEN\nTHROTTLE",
  "GONE FISHIN\nBE BACK\nLATER",
  "TALK BASS\nTO ME\nBABY",
  "EAT SLEEP\nFISH\nREPEAT",
  "JUST ONE MORE\nCAST\nI SWEAR",
  "GOOD THINGS\nCOME TO THOSE\nWHO BAIT",
  "HOOK LINE\nAND SINKER\nAGAIN",
  "SUNRISE COFFEE\nCAST\nREPEAT",
  "PROBLEMS SEEM\nSMALLER\nON THE LAKE",
  "KEEPIN IT REEL\nOUT\nHERE",
  "THIS IS MY\nRESTING\nFISH FACE",
  "BORN TO FISH\nFOR\nTHE BIG ONE",
  "WEEKEND\nFORECAST\n100% FISH",
  "REEL COOL DAD\nMODE\nACTIVATED",
  "SOME CALL IT\nFISHING I CALL\nIT THERAPY",
  "HAT THROWN\nTASSEL MOVED\nBRAIN TIRED",
  "WHAT LIKE\nITS HARD\n- ELLE WOODS",
  "SHE BELIEVED\nSHE COULD\nSO SHE DID",
  "DIPLOMA YES\nDIRECTION\nPENDING",
  "DREAM BIG\nWORK HARD\nSTAY HUMBLE",
  "NOW ACCEPTING\nAPPLAUSE CASH\nAND NAPS",
  "TRUST THE MAGIC\nOF NEW\nBEGINNINGS",
  "ON TO THE NEXT\nCHAPTER\nBRB ADULTING",
  "I CAME I SAW\nI SURVIVED\nGROUP PROJECTS",
  "SMART ENOUGH\nBRAVE ENOUGH\nDONE ENOUGH",
  "SWEETHEART\nI AM\nTHE STORM",
  "I DONT DO\nPOLITE\nI DO HONEST",
  "LOVE HARD\nRIDE HARD\nSTAY LOYAL",
  "THIS LAND AINT\nFOR\nQUITTERS",
  "HOLD THE LINE\nTHEN HOLD\nIT MORE",
  "WORK FIRST\nWHISKEY\nLATER",
  "IN A WORLD\nON FIRE\nCHOOSE US",
  "ME AND YOU\nAGAINST\nTHE WILD",
  "MONTANA MAKES\nSMALL MEN\nQUIET",
  "RIDE FAST\nLOVE DEEP\nFEAR LESS",
  "OUT HERE MERCY\nHAS\nSPURS",
  "THE WEST DONT\nCARE\nBE WORTHY",
  "HOME IS WHERE\nYOUR HORSE\nSTOPS",
  "IF I STAND\nBESIDE YOU\nI MEAN IT",
  "COWBOYS TALK\nTRASH THEN\nSHOW UP",
  "SUNSET DUST\nCOLD AIR\nWARM FIRE",
  "THESE ARE A FEW\nOF MY FAVORITE\nTHINGS",
  "SO LONG\nFAREWELL\nAUF WIEDERSEHEN",
  "EDELWEISS\nEVERY MORNING\nYOU GREET ME",
  "I AM SIXTEEN\nGOING ON\nSEVENTEEN",
  "THE SUN HAS\nGONE TO BED\nAND SO MUST I",
  "I HAVE\nCONFIDENCE\nIN SUNSHINE",
  "HIGH ON A HILL\nWAS A LONELY\nGOATHERD",
  "I MUST HAVE\nDONE SOMETHING\nGOOD",
  "HELLO MY NAME\nIS INIGO\nMONTOYA",
  "YOU KILLED MY\nFATHER PREPARE\nTO DIE",
  "YOU KEEP USING\nTHAT WORD\nINCONCEIVABLE",
  "HAVE FUN\nSTORMING\nTHE CASTLE",
  "AS YOU WISH\nAS YOU WISH\nAS YOU WISH",
  "ANYBODY\nWANT\nA PEANUT",
  "MAWWIAGE IS\nWHAT BWINGS US\nTOGETHAH TODAY",
  "LIFE IS PAIN\nANYONE WHO SAYS\nDIFFERENT LIES",
  "TRULY YOU HAVE\nA DIZZYING\nINTELLECT",
  "HAKUNA MATATA\nIT MEANS NO\nWORRIES",
  "YOU GOT A\nFRIEND\nIN ME",
  "LET IT GO\nCANT HOLD IT\nBACK ANYMORE",
  "CAN YOU FEEL\nTHE LOVE\nTONIGHT",
  "A WHOLE\nNEW\nWORLD",
  "WHISTLE WHILE\nYOU\nWORK",
  "OH YES THE PAST\nCAN HURT BUT\nYOU CAN RUN",
  "ITS LIKE THE\nFOG HAS\nLIFTED",
  "LADIES DONT\nSTART FIGHTS\nTHEY FINISH EM",
  "SUPERCALI\nFRAGILISTIC\nEXPIALIDOCIOUS",
  "THE SEAWEED IS\nALWAYS GREENER\nON THE OTHER",
  "OUR FATE\nLIVES\nWITHIN US",
  "WHEN LIFE GETS\nYOU DOWN\nJUST KEEP SWIMM",
  "NO MATTER HOW\nYOUR HEART\nGRIEVES",
  "AND I DONT WANT\nTHE WORLD TO\nSEE ME",
  "AFTER ALL\nYOURE MY\nWONDERWALL",
  "MORE THAN WORDS\nIS ALL YOU HAVE\nTO DO",
  "I WANNA STAND\nWITH YOU ON\nA MOUNTAIN",
  "IM ALL OUTTA\nFAITH THIS IS\nHOW I FEEL",
  "KISS ME\nBENEATH THE\nMILKY TWILIGHT",
  "IM SMARTER THAN\nTHE AVERAGE\nBEAR",
  "HEY BOO BOO\nWHATS IN\nTHAT BASKET",
  "RANGER SMITH\nIS ONTO\nUS AGAIN",
  "A BEARS GOTTA\nEAT\nYOU KNOW",
  "CANT CATCH YOGI\nTHAT\nEASY",
  "SMELL THAT\nPICNIC\nIN THE AIR",
  "BOO BOO\nKEEP LOOKOUT\nBUDDY",
  "HOUSTON\nWE HAVE\nA PROBLEM",
  "THE EAGLE HAS\nLANDED\nON THE MOON",
  "ONE SMALL STEP\nONE GIANT LEAP\nFOR MANKIND",
  "WE CAME IN\nPEACE FOR\nALL MANKIND",
  "NO BORDERS\nNO NOISE\nJUST BLUE PLANET",
  "SPACE CHANGES\nHOW YOU SEE\nEVERYTHING",
  "I TOUCH THE SKY\nAND STILL\nMISS HOME",
  "ASK NOT WHAT\nYOUR COUNTRY\nCAN DO FOR YOU",
  "MR GORBACHEV\nTEAR DOWN\nTHIS WALL",
  "SPEAK SOFTLY\nAND CARRY\nA BIG STICK",
  "YES WE CAN\nYES WE DID\nYES WE WILL",
  "THE ONLY THING\nTO FEAR IS\nFEAR ITSELF",
  "A HOUSE DIVIDED\nCANNOT\nSTAND",
  "GOONIES\nNEVER\nSAY DIE",
  "HEY\nYOU\nGUYS",
  "THIS IS OUR\nTIME DOWN\nHERE",
  "THIS ONE IS\nMINE\nMY DREAM",
  "THATS WHAT I\nSAID\nBOOBY TRAPS",
  "WERE GONNA\nFIND THAT\nTREASURE",
  "WELCOME TO\nBARBIE\nLAND",
  "WEIRD BARBIE\nALWAYS\nKNOWS",
  "HUMANS ONLY\nHAVE ONE ENDING\nIDEAS LIVE ON",
  "PATRIARCHY IS\nNOT ABOUT\nHORSES",
  "I WANT TO BE\nTHE ONE WHO\nIMAGINES",
  "YOU HAVE TO GO\nTO THE\nREAL WORLD",
  "IM IN THE THICK\nOF IT\nWITH YOU",
  "IM NOT A REGULR\nMOM IM A\nCOOL MOM",
  "MOMS JUST WANNA\nHAVE FUN\nTOO",
  "WE CAN BE GOOD\nMOMS AND\nHAVE FUN",
  "I CHOOSE ME\nFOR ONCE AND\nI LIKE IT",
  "YOU ARE DOING\nAMAZING\nSWEETIE",
  "THIS MOM STUFF\nIS HARD\nEVERY DAY",
  "IM DONE BEING\nPERFECT FOR\nEVERYONE",
  "YER A WIZARD\nHARRY\nIM A WHAT",
  "AFTER ALL THIS\nTIME\nALWAYS",
  "I SOLEMNLY\nSWEAR IM UP\nTO NO GOOD",
  "DOBBY IS FREE\nDOBBY HAS\nNO MASTER",
  "NOT MY\nDAUGHTER\nYOU BITCH",
  "WEVE ALL GOT\nLIGHT AND DARK\nINSIDE US",
  "YOURE JUST AS\nSANE\nAS I AM",
  "TURN TO PAGE\nTHREE HUNDRED\nNINETY FOUR",
  "HAVE A BISCUIT\nPOTTER\nMINERVA SAID",
  "NITWIT BLUBBER\nODDMENT\nTWEAK",
  "VACATION ALL I\nEVER\nWANTED",
  "ON THE ROAD\nAGAIN I CANT\nWAIT TO GO",
  "LIFE IS A\nHIGHWAY I\nWANNA RIDE IT",
  "TAKE ME HOME\nCOUNTRY ROADS\nTO THE PLACE",
  "ROADS WHERE\nWERE GOING\nWE NEED NONE",
  "NOBODY PUTS\nBABY IN\nA CORNER",
  "YOURE KILLIN\nME SMALLS\nFOR EV ER",
  "OHANA MEANS\nFAMILY NO ONE\nLEFT BEHIND",
  "TO INFINITY\nAND BEYOND\nPARTNER",
  "COME WITH ME\nIF YOU WANT\nTO LIVE",
  "MAY THE FORCE\nBE WITH YOU\nALWAYS",
  "WILDERNESS\nMUST BE\nEXPLORED",
  "ADVENTURE IS\nOUT THERE\nCOME ON IN",
  "GO THE DISTANCE\nI WILL FIND\nMY WAY",
  "I VOLUNTEER\nAS TRIBUTE\nFOR SNACKS",
  "YOU CANT SIT\nWITH US\nNOT TODAY",
  "JUST KEEP\nSWIMMING\nSWIMMING",
  "AINT NO\nMOUNTAIN HIGH\nENOUGH",
  "THERES NO\nPLACE\nLIKE HOME",
  "THE HILLS ARE\nALIVE WITH THE\nSOUND OF MUSIC",
  "HERE COMES THE\nSUN AND I SAY\nITS ALRIGHT",
  "LET IT BE\nWHISPER WORDS\nOF WISDOM",
  "COME TOGETHER\nRIGHT NOW\nOVER ME",
  "HEY JUDE DONT\nMAKE IT\nBAD",
  "WELCOME TO THE\nHOTEL\nCALIFORNIA",
  "GO YOUR OWN\nWAY\nGO YOUR OWN",
  "DONT STOP\nTHINKING ABOUT\nTOMORROW",
  "YOU MAKE\nLOVIN FUN\nYOU REALLY DO",
  "PEACEFUL EASY\nFEELING\nWONT LET GO",
  "DREAM ON\nDREAM ON\nDREAM ON",
  "CARRY ON MY\nWAYWARD SON\nTHERELL BE PEACE",
  "ALL RIGHT NOW\nBABY ITS\nALRIGHT NOW",
  "BORN TO BE\nWILD\nBORN TO BE",
  "DROVE MY CHEVY\nTO THE LEVEE\nBUT THE LEVEE",
  "SING US A SONG\nYOURE THE\nPIANO MAN",
  "SWEET HOME\nALABAMA\nWHERE SKIES ARE",
  "DUST IN THE\nWIND\nALL WE ARE",
  "    BAD MOON \n    ON THE     \n     RISE      ",
  "HAVE YOU EVER\nSEEN THE RAIN\nCOMIN DOWN",
  "STAIRWAY TO\nHEAVEN\nSHES BUYING",
  "SWEET EMOTION\nSWEET\nEMOTION",
  "MORE THAN A\nFEELING\nMORE THAN A",
  "MAGIC CARPET\nRIDE\nCOME ON BABY",
  "LISTEN TO THE\nMUSIC\nALL THE TIME",
  "FORTUNATE SON\nIT AINT ME\nIT AINT ME",
  "RAMBLE ON\nAND NOW IS\nTHE TIME",
  "YOU ARE DOING\nBETTER THAN\nYOU THINK",
  "BREATHE IN\nBREATHE OUT\nKEEP GOING",
  "YOU CAN DO\nHARD THINGS\nWITH GRACE",
  "YOUR PEACE\nIS POWER\nPROTECT IT",
  "SMALL STEPS\nSTILL MOVE\nYOU FORWARD",
  "YOU ARE ENOUGH\nEXACTLY\nAS YOU ARE",
  "TRUST YOUR OWN\nTIMING\nAND YOUR PATH",
  "GOOD THINGS\nARE GROWING\nIN YOU",
  "BE PROUD OF\nHOW FAR\nYOU HAVE COME",
  "YOUR STORY\nIS STILL\nUNFOLDING",
  "ONE DAY\nONE BREATH\nONE STEP",
  "CALM MIND\nOPEN HEART\nSTEADY FEET",
  "YOU ARE MAGIC\nAND MUSCLE\nBOTH AT ONCE",
  "BLOOM IN YOUR\nOWN\nSEASON",
  "CHOOSE PEACE\nOVER PANIC\nTODAY",
  "HOLD HOPE\nA LITTLE\nLONGER",
  "YOU ARE LOVED\nMORE THAN\nYOU KNOW",
  "LET TODAY BE\nA FRESH\nBEGINNING",
  "YOU GET TO\nBEGIN AGAIN\nTODAY",
  "REST IS\nPRODUCTIVE\nTOO",
  "JOY IS\nWELCOME\nHERE TOO",
  "YOUR HEART\nKNOWS THE\nWAY FORWARD",
  "TODAY CAN\nSTILL TURN\nAROUND",
  "BE GENTLE WITH\nYOUR\nSELF TALK",
  "YOU ARE MORE\nTHAN\nA BAD DAY",
  "THERE IS POWER\nIN\nPATIENCE",
  "YOUR LIGHT\nHELPS OTHERS\nSEE TOO",
  "YOU ARE STRONG\nSOFT\nAND WISE",
  "KEEP THE FAITH\nIN\nYOURSELF",
  "YOU BELONG WITH\nME YOU\nBELONG",
  "ITS A LOVE\nSTORY BABY\nJUST SAY YES",
  "PLAYERS GONNA\nPLAY HATERS\nGONNA HATE",
  "ITS ME HI\nIM THE\nPROBLEM",
  "NEVER GONNA\nGIVE YOU UP\nNEVER GONNA",
  "SHAKE IT\nSHAKE SHAKE\nSHAKE IT",
  "BILLIE JEAN\nIS NOT MY\nLOVER",
  "CAUSE THIS IS\nTHRILLER\nTHRILLER NITE",
  "BEAT IT\nBEAT IT\nNO ONE WANTS",
  "LIKE A PRAYER\nWHEN YOU CALL\nMY NAME",
  "STRIKE A POSE\nTHERES\nNOTHING TO IT",
  "SWEET DREAMS\nARE MADE OF\nTHIS",
  "JUST LIKE THE\nWHITE WINGED\nDOVE",
  "THUNDER ONLY\nHAPPENS WHEN\nITS RAINING",
  "DONT STOP\nBELIEVIN\nHOLD ON TO",
  "WHOA WERE\nHALF WAY\nTHERE",
  "HIT ME WITH\nYOUR BEST SHOT\nFIRE AWAY",
  "WE WILL\nWE WILL\nROCK YOU",
  "ANOTHER ONE\nBITES THE\nDUST",
  "PURPLE RAIN\nPURPLE RAIN\nPURPLE RAIN",
  "GIRLS JUST\nWANT TO HAVE\nFUN",
  "TAKE ON ME\nTAKE ME\nON",
  "TAINTED\nLOVE\nOH TAINTED",
  "COME ON EILEEN\nOH I SWEAR\nWHAT HE MEANS",
  "OH MICKEY\nYOURE SO FINE\nYOURE SO FINE",
  "WE CAN DANCE\nIF WE WANT\nTO",
  "LOVE SHACK\nBABY\nLOVE SHACK",
  "MIGHT AS WELL\nJUMP\nJUMP",
  "YOU SHOOK ME\nALL NIGHT\nLONG",
  "TURN AROUND\nBRIGHT EYES\nTURN AROUND",
  "I BLESS THE\nRAINS DOWN\nIN AFRICA",
  "ITS THE EYE\nOF THE TIGER\nITS THE THRILL",
  "ITS THE\nFINAL\nCOUNTDOWN",
  "SWEET\nCAROLINE\nBA BA BA",
  "HOLD ME CLOSER\nTINY\nDANCER",
  "YOU ARE THE\nDANCING QUEEN\nYOUNG AND FREE",
  "MAMMA MIA\nHERE I GO\nAGAIN",
  "AH AH AH AH\nSTAYIN\nALIVE",
  "OH NO NOT I\nI WILL\nSURVIVE",
  "DO YOU REMEMBER\nTHE 21ST\nOF SEPTEMBER",
  "ALL NIGHT LONG\nALL NIGHT\nALL NIGHT",
  "R E S P E C T\nFIND OUT WHAT\nIT MEANS TO ME",
  "IVE GOT\nSUNSHINE ON A\nCLOUDY DAY",
  "OH HERE SHE\nCOMES WATCH\nOUT BOY",
  "IT STARTED OUT\nWITH A\nKISS",
  "OH MY GOD\nBECKY LOOK AT\nHER BUTT",
  "ICE ICE\nBABY\nTOO COLD",
  "JUMP AROUND\nJUMP AROUND\nJUMP UP JUMP",
  "HEY\nMACARENA\nAY",
  "A LITTLE BIT\nOF MONICA IN\nMY LIFE",
  "TELL ME WHY\nAINT NOTHIN\nBUT A HEARTACHE",
  "BYE BYE BYE\nBYE BYE\nDONT WANNA",
  "IF YOU WANNA\nBE MY LOVER\nYOU GOTTA GET",
  "LETS GO GIRLS\nMAN I FEEL\nLIKE A WOMAN",
  "ALL I WANT\nFOR CHRISTMAS\nIS YOU",
  "I WANNA DANCE\nWITH\nSOMEBODY",
  "AND I WILL\nALWAYS LOVE\nYOU",
  "START\nSPREADING THE\nNEWS",
  "FLY ME TO\nTHE MOON LET\nME PLAY AMONG",
  "NO I DONT WANT\nNO\nSCRUB",
  "DONT GO\nCHASING\nWATERFALLS",
  "HIT ME BABY\nONE MORE\nTIME",
  "OOPS I\nDID IT AGAIN\nTO YOUR HEART",
  "KNOW WHEN TO\nHOLD EM KNOW\nWHEN TO FOLD",
  "YOU GOTTA FIGHT\nFOR YOUR\nRIGHT TO PARTY",
  "POUR SOME\nSUGAR ON ME\nOOH IN THE",
  "UPTOWN GIRL\nSHES BEEN\nLIVING IN HER",
  "YOU MAKE MY\nDREAMS COME\nTRUE",
  "SUMMER LOVIN\nHAD ME A BLAST\nSUMMER NIGHTS",
  "IM HERE FOR A\nGOOD TIME\nNOT A LONG ONE",
  "NO ALARMS\nNO EMAILS\nNO PROBLEM",
  "NAP NOW\nHIKE LATER\nMAYBE",
  "IF LOST FOLLOW\nTHE\nSMORES",
  "LESS RUSH\nMORE LIFE\nENJOY",
  "LOOK UP\nTHIS SKY IS\nWILD",
  "SLOW NIGHTS\nGOOD PEOPLE\nGREAT MEMORIES",
  "DIRT ROADS\nCLEAR MINDS\nHAPPY HEARTS",
  "THIS IS YOUR\nRESET BUTTON\nUSE IT",
  "MEMORIES ARE\nBEING MADE\nTODAY",
  "BREATHE IT IN\nTHIS IS IT\nRIGHT NOW",
  "CABIN DAYS\nWILD WAYS\nENJOY",
  "AFTER RIVER\nBEFORE FIRE\nPERFECT DAY",
  "FLOAT THE\nBIG SPRINGS\nTODAY",
  "YOU MADE IT\nOUT OF OFFICE\nFOR REAL",
];

const CLEANING_REMINDERS = [
  "TAKE PHOTOS\nOF HOW YOU\nFOUND IT FIRST",
  "SEND PHOTOS\nTO TEARA AT\n3856850272",
  "CHECK UNDER\nALL 6 BEDS\nAND VACUUM",
  "REPLACE ALL\n8 QUEEN BED\nLINENS",
  "REPLACE ALL\nBUNK BED\nLINENS",
  "CHECK ALL\n5 BATHROOMS\nRESTOCKED",
  "RESTOCK ALL\nTOILETRIES\nAND TOWELS",
  "CLEAN AND\nCHECK HOT TUB\nOUTSIDE",
  "CHECK BOTH\nOUTDOOR\nGRILLS",
  "DONT FORGET\nGAME ROOM\nCLEAN IT ALL",
  "WASH LINENS\nBOTH WASHER\nDRYERS GAME RM",
  "PLACE COOLER\nGIFT ON THE\nKITCHEN TABLE",
  "CHECK REMOTES\nGATHERING RM\nAND GAME ROOM",
  "ARRANGE ALL\nOUTDOOR\nFURNITURE",
  "CHECK FRIDGE\nREMOVE ALL\nLEFTOVERS",
  "RESTOCK\nCOFFEE TEA\nAND SUPPLIES",
  "CHECK ALL\nPAPER TOWELS\nAND NAPKINS",
  "WIPE DOWN ALL\nKITCHEN\nAPPLIANCES",
  "RUN THE\nDISHWASHER\nCHECK IT",
  "VACUUM AND\nSWEEP ALL\nFLOORS",
  "DUST ALL\nCEILING FANS\nCHECK LIGHTS",
  "CHECK ALL\nCLOSETS FOR\nLEFT ITEMS",
  "TAKE OUT ALL\nTRASH AND\nRECYCLING",
  "CHECK ALL\nDOOR LOCKS\nAND KEYPADS",
  "TAKE PHOTOS\nAFTER CLEANING\nBEFORE YOU GO",
  "SEND PHOTOS\nTO TEARA AT\n3856850272",
];

const CLEANING_REMINDERS_CHECKIN = [
  ...CLEANING_REMINDERS,
  "GUESTS CHECK\nIN TODAY TURN\nON ICE MACHINE",
];

const SOUVENIR_MESSAGES = [
  "ISLAND PARK\nGIFTS + GEAR\nTXT 2085890503",
  "HOODIES SHIRTS\nSTICKERS + MORE\nTXT 2085890503",
  "ORNAMENTS AND\nSOUVENIRS AVAIL\nTXT 2085890503",
];

function shuffleQuotes() {
  quoteQueue = [...QUOTES].sort(() => Math.random() - 0.5);
  quoteRotationIndex = 0;
}

shuffleQuotes();

function authHeader() {
  return "Basic " + Buffer.from(`${OWNERREZ_EMAIL}:${OWNERREZ_PAT}`).toString("base64");
}

function isQuietHours() {
  const hour = parseInt(new Date().toLocaleString("en-US", { timeZone: "America/Denver", hour: "numeric", hour12: false }));
  return hour >= 21 || hour < 8;
}

function isOverrideActive() {
  return overrideUntil && new Date() < overrideUntil;
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

function buildCountdownMessage(nextArrival, localDate) {
  if (!nextArrival) return `NO UPCOMING\nCHECK INS\nSCHEDULED`;
  const today = new Date(localDate);
  const arrival = new Date(nextArrival);
  const diffTime = arrival - today;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return `NEXT GUESTS\nCHECK IN TODAY\nAT 3PM`;
  if (diffDays === 1) return `NEXT GUESTS\nCHECK IN\nTOMORROW`;
  return `NEXT GUESTS\nCHECK IN\nIN ${diffDays} DAYS`;
}

function getNextQuote() {
  if (quoteRotationIndex >= quoteQueue.length) shuffleQuotes();
  return quoteQueue[quoteRotationIndex++];
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function sendSMS(body) {
  try {
    await twilioClient.messages.create({
      body,
      from: TWILIO_FROM_NUMBER,
      to: TWILIO_TO_NUMBER,
    });
    console.log("SMS sent:", body);
  } catch (err) {
    console.error("SMS error:", err.message);
  }
}

async function fetchGuest(guestId) {
  const res = await fetch(`https://api.ownerrez.com/v2/guests/${guestId}`, {
    headers: { "Authorization": authHeader(), "Accept": "application/json", "User-Agent": "vestaboard-script" }
  });
  return res.json();
}

function getGuestPin(guest) {
  const phone = (guest?.phone || guest?.phone_number || "").replace(/\D/g, "");
  return phone.slice(-4) || "0000";
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
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location.query)}&appid=${WEATHER_API_KEY}&units=imperial`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    const data = await res.json();
    const list = data.list || [];
    if (list.length === 0) return null;
    const first = list[0];
    const todayDate = new Date().toLocaleDateString("en-CA", { timeZone: "America/Denver" });
    const todayItems = list.filter(item => {
      const itemDate = new Date(item.dt * 1000).toLocaleDateString("en-CA", { timeZone: "America/Denver" });
      return itemDate === todayDate;
    });
    const relevantItems = todayItems.length > 0 ? todayItems : [first];
    const high = Math.max(...relevantItems.map(item => item.main?.temp_max ?? item.main?.temp));
    const low = Math.min(...relevantItems.map(item => item.main?.temp_min ?? item.main?.temp));
    return {
      name: location.name,
      description: first.weather?.[0]?.description || "CLEAR",
      high,
      low
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
    const usFee = fees.find(f => f.title?.toLowerCase().includes("per vehicle") && !f.title?.toLowerCase().includes("non"));
    const intlFee = fees.find(f => f.title?.toLowerCase().includes("non"));
    if (!usFee) return null;
    const line1 = `${park.name} FEE`.padEnd(15).substring(0, 15);
    const line2 = `US VEH $${usFee.cost}`.padEnd(15).substring(0, 15);
    const line3 = intlFee ? `INTL VEH $${intlFee.cost}`.padEnd(15).substring(0, 15) : "7 DAY PASS     ";
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
    console.log("Vestaboard not connected - message ready:", text.replace(/\n/g, " | "));
    return;
  }
  try {
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
  } catch (err) {
    console.error("Vestaboard send error:", err.message);
  }
}

async function checkBookings() {
  if (isQuietHours()) {
    console.log("Quiet hours - no update.");
    return;
  }
  if (isOverrideActive()) {
    console.log("Override active - skipping automation.");
    return;
  }

  console.log("Checking bookings...");
  const now = new Date();
  const localDate = now.toLocaleDateString("en-CA", { timeZone: "America/Denver" });
  const localHour = parseInt(now.toLocaleString("en-US", { timeZone: "America/Denver", hour: "numeric", hour12: false }));
  const localMin = now.getMinutes();
  const localTime = localHour + localMin / 60;
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
    const activeBookings = bookings.filter(b => !b.is_block);

 // Grab currentGuest PIN from booking during entire stay for https://vestaboard-welcome-production.up.railway.app/guest
    const todayArrival = activeBookings.find(b => b.arrival === localDate);
    const todayDeparture = activeBookings.find(b => b.departure === localDate);
    const currentStay = activeBookings.find(b => b.arrival <= localDate && b.departure > localDate);

// Keep currentGuest loaded during entire stay
if (currentStay && !currentGuest) {
  const guest = await fetchGuest(currentStay.guest_id);
  currentGuest = guest;
  console.log(`Mid-stay guest loaded: ${guest.first_name}`);
}

   // Find next upcoming arrival
    const futureBookings = activeBookings
    .filter(b => b.arrival >= localDate)
    .sort((a, b) => a.arrival.localeCompare(b.arrival));
    nextArrivalDate = futureBookings[0]?.arrival || null;

    // CHECKOUT: 9am to 10:30am on departure day
    if (todayDeparture && localTime >= 9 && localTime < 10.5) {
      const guest = await fetchGuest(todayDeparture.guest_id);
      currentGuest = guest;
      const message = buildCheckoutMessage(guest.first_name);
      if (message !== lastMessage) {
        await sendToVestaboard(message);
        lastMessage = message;
      }
      return;
    }

    // CLEANING GAP: 10:30am to 3pm on departure day
    if (todayDeparture && localTime >= 10.5 && localTime < 15) {
      const isBackToBack = todayArrival !== undefined;
      const reminders = isBackToBack ? CLEANING_REMINDERS_CHECKIN : CLEANING_REMINDERS;
      const rand = Math.random();
      let message;

      if (rand < 0.40) {
        message = buildCountdownMessage(nextArrivalDate, localDate);
      } else if (rand < 0.65) {
        message = getRandomItem(reminders);
      } else if (rand < 0.70) {
        const allWeather = await fetchAllWeather();
        if (allWeather.length > 0) {
          message = buildWeatherMessage(allWeather[weatherRotationIndex % allWeather.length]);
          weatherRotationIndex++;
        }
      } else {
        message = getNextQuote();
      }

      if (message && message !== lastMessage) {
        await sendToVestaboard(message);
        lastMessage = message;
      }
      return;
    }

    // WELCOME: 3pm onwards on arrival day
    if (todayArrival && localTime >= 15) {
      const guest = await fetchGuest(todayArrival.guest_id);
      currentGuest = guest;
      const message = buildWelcomeMessage(guest.last_name);
      if (message !== lastMessage) {
        await sendToVestaboard(message);
        lastMessage = message;
      }
      return;
    }

    // REGULAR ROTATION
    console.log("Regular rotation - showing content.");
    const rand = Math.random();

    if (rand < 0.05) {
      const message = buildWifiMessage();
      if (message !== lastMessage) {
        await sendToVestaboard(message);
        lastMessage = message;
      }
    } else if (rand < 0.10) {
      const message = getRandomItem(SOUVENIR_MESSAGES);
      if (message !== lastMessage) {
        await sendToVestaboard(message);
        lastMessage = message;
      }
    } else if (rand < 0.30) {
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
    } else if (rand < 0.50) {
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
      const quote = getNextQuote();
      if (quote !== lastMessage) {
        await sendToVestaboard(quote);
        lastMessage = quote;
      }
    }

  } catch (err) {
    console.error("Error:", err.message);
  }
}

// ─── GUEST FORM ───────────────────────────────────────────────
app.get("/guest", (req, res) => {
  const pin = req.query.pin;
  const guestPin = currentGuest ? getGuestPin(currentGuest) : null;

  if (!pin) {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>The Gathering Place Vestaboard</title>
        <style>
          body { font-family: sans-serif; max-width: 400px; margin: 40px auto; padding: 20px; text-align: center; background: #111; color: #fff; }
          h1 { color: #f5c842; }
          input { width: 100%; padding: 12px; margin: 10px 0; border-radius: 8px; border: none; font-size: 16px; box-sizing: border-box; }
          button { background: #f5c842; color: #111; padding: 12px 24px; border: none; border-radius: 8px; font-size: 18px; cursor: pointer; width: 100%; margin-top: 10px; }
          p { color: #aaa; font-size: 14px; }
        </style>
      </head>
      <body>
        <h1>✨ The Gathering Place</h1>
        <p>Enter your 4-digit PIN to post a message to the Vestaboard!</p>
        <form action="/guest" method="get">
          <input type="number" name="pin" placeholder="Enter your PIN" maxlength="4" required />
          <button type="submit">Continue →</button>
        </form>
        <p>Your PIN is the last 4 digits of the phone number you booked with.</p>
      </body>
      </html>
    `);
    return;
  }

  if (!guestPin || pin !== guestPin) {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>The Gathering Place Vestaboard</title>
        <style>
          body { font-family: sans-serif; max-width: 400px; margin: 40px auto; padding: 20px; text-align: center; background: #111; color: #fff; }
          h1 { color: #f5c842; }
          a { color: #f5c842; }
        </style>
      </head>
      <body>
        <h1>❌ Incorrect PIN</h1>
        <p>That PIN didn't match. Please try again.</p>
        <a href="/guest">← Try again</a>
      </body>
      </html>
    `);
    return;
  }

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>The Gathering Place Vestaboard</title>
      <style>
        body { font-family: sans-serif; max-width: 400px; margin: 40px auto; padding: 20px; text-align: center; background: #111; color: #fff; }
        h1 { color: #f5c842; }
        textarea { width: 100%; padding: 12px; margin: 10px 0; border-radius: 8px; border: none; font-size: 16px; box-sizing: border-box; height: 120px; }
        button { background: #f5c842; color: #111; padding: 12px 24px; border: none; border-radius: 8px; font-size: 18px; cursor: pointer; width: 100%; margin-top: 10px; }
        p { color: #aaa; font-size: 13px; }
      </style>
    </head>
    <body>
      <h1>✨ Post to the Vestaboard</h1>
      <p>3 lines max, 15 characters per line. Use Enter to go to the next line.</p>
      <form action="/guest/post" method="post">
        <input type="hidden" name="pin" value="${pin}" />
        <textarea name="message" placeholder="Line 1&#10;Line 2&#10;Line 3" maxlength="47"></textarea>
        <button type="submit">Send to Board ✨</button>
      </form>
      <p>Your message will show for 2 hours, then our regular rotation resumes.</p>
    </body>
    </html>
  `);
});

app.post("/guest/post", async (req, res) => {
  const { pin, message } = req.body;
  const guestPin = currentGuest ? getGuestPin(currentGuest) : null;

  if (!guestPin || pin !== guestPin) {
    res.send("<h1>Invalid PIN</h1>");
    return;
  }

  const lines = message.split("\n").map(l => l.toUpperCase().substring(0, 15));
  while (lines.length < 3) lines.push("");
  const formatted = lines.slice(0, 3).join("\n");

  await sendToVestaboard(formatted);
  lastMessage = formatted;
  overrideUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);

  await sendSMS(`✨ VESTABOARD: Guest posted a message:\n"${formatted.replace(/\n/g, " | ")}"\nExpires at ${overrideUntil.toLocaleTimeString("en-US", { timeZone: "America/Denver", hour: "numeric", minute: "2-digit" })} MT`);

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>The Gathering Place Vestaboard</title>
      <style>
        body { font-family: sans-serif; max-width: 400px; margin: 40px auto; padding: 20px; text-align: center; background: #111; color: #fff; }
        h1 { color: #f5c842; }
        p { color: #aaa; }
      </style>
    </head>
    <body>
      <h1>🎉 Message Sent!</h1>
      <p>Your message is now showing on the Vestaboard!</p>
      <p>It will display for 2 hours, then our regular rotation resumes.</p>
      <p>Enjoy your stay at The Gathering Place 💛</p>
    </body>
    </html>
  `);
});

app.get("/debug", (_req, res) => {
  const pin = currentGuest ? getGuestPin(currentGuest) : "NO GUEST LOADED";
  const phone = currentGuest?.phone || currentGuest?.phone_number || "NO PHONE FOUND";
  res.json({
    currentGuest: currentGuest ? "LOADED" : "NULL",
    guestName: currentGuest?.first_name || "none",
    rawPhone: phone,
    calculatedPin: pin
  });
});

// ─── HEALTH CHECK ─────────────────────────────────────────────
app.get("/", (_req, res) => res.send("Vestaboard script running ✅"));

// ─── SCHEDULER ────────────────────────────────────────────────
setTimeout(() => checkBookings(), 3000);
setInterval(() => checkBookings(), 5 * 60 * 1000);

setInterval(() => {
  const now = new Date();
  const localHour = parseInt(now.toLocaleString("en-US", { timeZone: "America/Denver", hour: "numeric", hour12: false }));
  const localMin = now.getMinutes();
  if (localHour === 8 && localMin < 5) {
    checkBookings();
  }
}, 60 * 1000);

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
