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
  " LOOK FOR THE  \nBARENECESSITIES\n4GET YR STRIFE ",
  "GET UP GET OUT \n AND RIDE THE  \n POWDER TODAY  ",
  "   COLD AIR    \n   FULL TANK   \n  CLEAR MIND   ",
  "   WAKE PRAY   \n  RIDE REPEAT  \n    ALL DAY    ",
  " WHEN IN DOUBT \n   THROTTLE    \n      OUT      ",
  "   WORK HARD   \n  RIDE HARDER  \n    ALWAYS     ",
  "    RISE UP    \n    SUIT UP    \n    SEND IT    ",
  "  CHASE SNOW   \n  NOT EXCUSES  \n     TODAY     ",
  " GO WHERE THE  \n     TRAIL     \n   TAKES YOU   ",
  " SNOW DUST AND \n    HUSTLE     \n     BABY      ",
  "FUEL YOUR SOUL \n   ONE RIDE    \n   AT A TIME   ",
  " THE MOUNTAINS \n  ARE CALLING  \n   LET US GO   ",
  " BORN TO RIDE  \n    FORCED     \n    TO WORK    ",
  "  MAKE TODAY   \n   LOUD FAST   \n    AND FUN    ",
  " START THE DAY \n   WIDE OPEN   \n   THROTTLE    ",
  "  GONE FISHIN  \n    BE BACK    \n     LATER     ",
  "   TALK BASS   \n     TO ME     \n     BABY      ",
  "   EAT SLEEP   \n     FISH      \n    REPEAT     ",
  " JUST ONE MORE \n     CAST      \n    I SWEAR    ",
  "  GOOD THINGS  \n COME TO THOSE \n   WHO BAIT    ",
  "   HOOK LINE   \n  AND SINKER   \n     AGAIN     ",
  "SUNRISE COFFEE \n     CAST      \n    REPEAT     ",
  " PROBLEMS SEEM \n    SMALLER    \n  ON THE LAKE  ",
  "KEEPIN IT REEL \n      OUT      \n     HERE      ",
  "  THIS IS MY   \n    RESTING    \n   FISH FACE   ",
  " BORN TO FISH  \n      FOR      \n  THE BIG ONE  ",
  "    WEEKEND    \n   FORECAST    \n   100% FISH   ",
  " REEL COOL DAD \n     MODE      \n   ACTIVATED   ",
  " SOME CALL IT  \nFISHING I CALL \n  IT THERAPY   ",
  "  HAT THROWN   \n TASSEL MOVED  \n  BRAIN TIRED  ",
  "   WHAT LIKE   \n   ITS HARD    \n - ELLE WOODS  ",
  " SHE BELIEVED  \n   SHE COULD   \n  SO SHE DID   ",
  "  DIPLOMA YES  \n   DIRECTION   \n    PENDING    ",
  "   DREAM BIG   \n   WORK HARD   \n  STAY HUMBLE  ",
  " NOW ACCEPTING \n APPLAUSE CASH \n   AND NAPS    ",
  "TRUST THE MAGIC\n    OF NEW     \n  BEGINNINGS   ",
  "ON TO THE NEXT \n    CHAPTER    \n BRB ADULTING  ",
  " I CAME I SAW  \n  I SURVIVED   \nGROUP PROJECTS ",
  " SMART ENOUGH  \n BRAVE ENOUGH  \n  DONE ENOUGH  ",
  "  SWEETHEART   \n     I AM      \n   THE STORM   ",
  "   I DONT DO   \n    POLITE     \n  I DO HONEST  ",
  "   LOVE HARD   \n   RIDE HARD   \n  STAY LOYAL   ",
  "THIS LAND AINT \n      FOR      \n   QUITTERS    ",
  " HOLD THE LINE \n   THEN HOLD   \n    IT MORE    ",
  "  WORK FIRST   \n    WHISKEY    \n     LATER     ",
  "  IN A WORLD   \n    ON FIRE    \n   CHOOSE US   ",
  "  ME AND YOU   \n    AGAINST    \n   THE WILD    ",
  " MONTANA MAKES \n   SMALL MEN   \n     QUIET     ",
  "   RIDE FAST   \n   LOVE DEEP   \n   FEAR LESS   ",
  "OUT HERE MERCY \n      HAS      \n     SPURS     ",
  " THE WEST DONT \n     CARE      \n   BE WORTHY   ",
  " HOME IS WHERE \n  YOUR HORSE   \n     STOPS     ",
  "  IF I STAND   \n  BESIDE YOU   \n   I MEAN IT   ",
  " COWBOYS TALK  \n  TRASH THEN   \n    SHOW UP    ",
  "  SUNSET DUST  \n   COLD AIR    \n   WARM FIRE   ",
  "THESE ARE A FEW\nOF MY FAVORITE \n    THINGS     ",
  "    SO LONG    \n   FAREWELL    \nAUF WIEDERSEHEN",
  "   EDELWEISS   \n EVERY MORNING \n YOU GREET ME  ",
  " I AM SIXTEEN  \n   GOING ON    \n   SEVENTEEN   ",
  "  THE SUN HAS  \n  GONE TO BED  \n AND SO MUST I ",
  "    I HAVE     \n  CONFIDENCE   \n  IN SUNSHINE  ",
  "HIGH ON A HILL \n WAS A LONELY  \n   GOATHERD    ",
  "  I MUST HAVE  \nDONE SOMETHING \n     GOOD      ",
  " HELLO MY NAME \n   IS INIGO    \n    MONTOYA    ",
  " YOU KILLED MY \nFATHER PREPARE \n    TO DIE     ",
  "YOU KEEP USING \n   THAT WORD   \n INCONCEIVABLE ",
  "   HAVE FUN    \n   STORMING    \n  THE CASTLE   ",
  "  AS YOU WISH  \n  AS YOU WISH  \n  AS YOU WISH  ",
  "    ANYBODY    \n     WANT      \n   A PEANUT    ",
  "  MAWWIAGE IS  \nWHAT BWINGS US \nTOGETHAH TODAY ",
  " LIFE IS PAIN  \nANYONE WHO SAYS\nDIFFERENT LIES ",
  "TRULY YOU HAVE \n  A DIZZYING   \n   INTELLECT   ",
  " HAKUNA MATATA \n  IT MEANS NO  \n    WORRIES    ",
  "   YOU GOT A   \n    FRIEND     \n     IN ME     ",
  "   LET IT GO   \n CANT HOLD IT  \n BACK ANYMORE  ",
  "   JUST KEEP   \n   SWIMMING    \n   SWIMMING    ",
  "  WILDERNESS   \n    MUST BE    \n   EXPLORED    ",
  " ADVENTURE IS  \n   OUT THERE   \n  COME ON IN   ",
  "THE SEAWEED IS \nALWAYS GREENER \n ON OTHER SIDE ",
  "   SUPERCALI   \n  FRAGILISTIC  \nEXPIALIDOCIOUS ",
  " WHEN YOU WISH \n  UPON A STAR  \n MAKES IT TRUE ",
  " BE OUR GUEST  \n BE OUR GUEST  \nPUT OUR SERVICE",
  "CIRCLE OF LIFE \nIT MOVES US ALL\nTHROUGH DESPAIR",
  "   THERES NO   \n     PLACE     \n   LIKE HOME   ",
  "WERE OFF TO SEE\n  THE WIZARD   \n THE WONDERFUL ",
  " I DO BELIEVE  \n   IN SPOOKS   \n   I DO I DO   ",
  "IGNORE THE MAN \n  BEHIND THE   \n    CURTAIN    ",
  "  TOTO I HAVE  \n   A FEELING   \nWERE NOT IN KS ",
  "   JUST KEEP   \n   SWIMMING    \nJUST KEEP SWIMM",
  "   FISH ARE    \n    FRIENDS    \n   NOT FOOD    ",
  "   P SHERMAN   \n42 WALLABY WAY \n    SYDNEY     ",
  "VACATION ALL I \n     EVER      \n    WANTED     ",
  "  ON THE ROAD  \n AGAIN I CANT  \n  WAIT TO GO   ",
  "   LIFE IS A   \n   HIGHWAY I   \n WANNA RIDE IT ",
  " TAKE ME HOME  \n COUNTRY ROADS \n TO THE PLACE  ",
  "  ROADS WHERE  \n  WERE GOING   \n WE NEED NONE  ",
  "  NOBODY PUTS  \n    BABY IN    \n   A CORNER    ",
  " YOURE KILLIN  \n   ME SMALLS   \n   FOR EV ER   ",
  "  OHANA MEANS  \n FAMILY NO ONE \n  LEFT BEHIND  ",
  "  TO INFINITY  \n  AND BEYOND   \n    PARTNER    ",
  " COME WITH ME  \n  IF YOU WANT  \n    TO LIVE    ",
  " MAY THE FORCE \n  BE WITH YOU  \n    ALWAYS     ",
  "GO THE DISTANCE\n  I WILL FIND  \n    MY WAY     ",
  "  I VOLUNTEER  \n  AS TRIBUTE   \n  FOR SNACKS   ",
  " YOU CANT SIT  \n    WITH US    \n   NOT TODAY   ",
  "    AINT NO    \n MOUNTAIN HIGH \n    ENOUGH     ",
  " THE HILLS ARE \nALIVE WITH THE \nSOUND OF MUSIC ",
  "HERE COMES THE \n SUN AND I SAY \n  ITS ALRIGHT  ",
  "   LET IT BE   \n WHISPER WORDS \n   OF WISDOM   ",
  " COME TOGETHER \n   RIGHT NOW   \n    OVER ME    ",
  " HEY JUDE DONT \n    MAKE IT    \n      BAD      ",
  "WELCOME TO THE \n     HOTEL     \n  CALIFORNIA   ",
  "  GO YOUR OWN  \n      WAY      \n  GO YOUR OWN  ",
  "   DONT STOP   \nTHINKING ABOUT \n   TOMORROW    ",
  "   YOU MAKE    \n   LOVIN FUN   \n YOU REALLY DO ",
  " PEACEFUL EASY \n    FEELING    \n  WONT LET GO  ",
  "   DREAM ON    \n   DREAM ON    \n   DREAM ON    ",
  "  CARRY ON MY  \n  WAYWARD SON  \nTHERLL BE PEACE",
  " ALL RIGHT NOW \n   BABY ITS    \n  ALRIGHT NOW  ",
  "  BORN TO BE   \n     WILD      \n  BORN TO BE   ",
  "DROVE MY CHEVY \n TO THE LEVEE  \n BUT THE LEVY  ",
  " AMERICAN PIE  \n  THE DAY THE  \n  MUSIC DIED   ",
  " HAVE YOU EVER \n SEEN THE RAIN \n  COMIN DOWN   ",
  "   BAD MOON    \n  ON THE RISE  \n   LOOK OUT    ",
  "  PROUD MARY   \n    KEEP ON    \n    BURNIN     ",
  " ROLLIN ON THE \n     RIVER     \n     TINA      ",
  "  I HEARD IT   \n  THROUGH THE  \n   GRAPEVINE   ",
  "    RESPECT    \n FIND OUT WHAT \nIT MEANS TO ME ",
  "DANCING IN THE \n    STREET     \n  LETS DANCE   ",
  "    MY GIRL    \n  TALKIN BOUT  \n    MY GIRL    ",
  "   AIN'T NO    \n MOUNTAIN HIGH \n    ENOUGH     ",
  "   REACH OUT   \n ILL BE THERE  \n   FOUR TOPS   ",
  "I TOUCH THE SKY\n   AND STILL   \n   MISS HOME   ",
  " ASK NOT WHAT  \n YOUR COUNTRY  \nCAN DO FOR YOU ",
  " MR GORBACHEV  \n   TEAR DOWN   \n   THIS WALL   ",
  " SPEAK SOFTLY  \n   AND CARRY   \n  A BIG STICK  ",
  "  YES WE CAN   \n  YES WE DID   \n  YES WE WILL  ",
  "THE ONLY THING \n  TO FEAR IS   \n  FEAR ITSELF  ",
  "A HOUSE DIVIDED\n    CANNOT     \n     STAND     ",
  "    GOONIES    \n     NEVER     \n    SAY DIE    ",
  "      HEY      \n      YOU      \n     GUYS      ",
  "  THIS IS OUR  \n   TIME DOWN   \n     HERE      ",
  "  THIS ONE IS  \n     MINE      \n   MY DREAM    ",
  " THATS WHAT I  \n     SAID      \n  BOOBY TRAPS  ",
  "  WERE GONNA   \n   FIND THAT   \n   TREASURE    ",
  "  WELCOME TO   \n    BARBIE     \n     LAND      ",
  " WEIRD BARBIE  \n    ALWAYS     \n     KNOWS     ",
  "  HUMANS ONLY  \nHAVE ONE ENDING\n IDEAS LIVE ON ",
  " PATRIARCHY IS \n   NOT ABOUT   \n    HORSES     ",
  " I WANT TO BE  \n  THE ONE WHO  \n   IMAGINES    ",
  "YOU HAVE TO GO \n    TO THE     \n  REAL WORLD   ",
  "IM IN THE THICK\n     OF IT     \n   WITH YOU    ",
  "IM NOT A REGULR\n   MOM IM A    \n   COOL MOM    ",
  "MOMS JUST WANNA\n   HAVE FUN    \n      TOO      ",
  "WE CAN BE GOOD \n   MOMS AND    \n   HAVE FUN    ",
  "  I CHOOSE ME  \n FOR ONCE AND  \n   I LIKE IT   ",
  " YOU ARE DOING \n    AMAZING    \n    SWEETIE    ",
  "THIS MOM STUFF \n    IS HARD    \n   EVERY DAY   ",
  " IM DONE BEING \n  PERFECT FOR  \n   EVERYONE    ",
  " YER A WIZARD  \n     HARRY     \n   IM A WHAT   ",
  "AFTER ALL THIS \n     TIME      \n    ALWAYS     ",
  "  I SOLEMNLY   \n  SWEAR IM UP  \n  TO NO GOOD   ",
  " DOBBY IS FREE \n   DOBBY HAS   \n   NO MASTER   ",
  "    NOT MY     \n   DAUGHTER    \n   YOU BITCH   ",
  " WEVE ALL GOT  \nLIGHT AND DARK \n   INSIDE US   ",
  " YOURE JUST AS \n     SANE      \n    AS I AM    ",
  " TURN TO PAGE  \n THREE HUNDRED \n  NINETY FOUR  ",
  "HAVE A BISCUIT \n    POTTER     \n MINERVA SAID  ",
  "NITWIT BLUBBER \n    ODDMENT    \n     TWEAK     ",
  " YOU ARE MORE  \n     THAN      \n   A BAD DAY   ",
  "THERE IS POWER \n      IN       \n   PATIENCE    ",
  "  YOUR LIGHT   \n HELPS OTHERS  \n    SEE TOO    ",
  "YOU ARE STRONG \n     SOFT      \n   AND WISE    ",
  "KEEP THE FAITH \n      IN       \n   YOURSELF    ",
  "YOU BELONG WITH\n    ME YOU     \n    BELONG     ",
  "  ITS A LOVE   \n  STORY BABY   \n JUST SAY YES  ",
  " PLAYERS GONNA \n  PLAY HATERS  \n  GONNA HATE   ",
  "   ITS ME HI   \n    IM THE     \n    PROBLEM    ",
  "  NEVER GONNA  \n  GIVE YOU UP  \n  NEVER GONNA  ",
  "   SHAKE IT    \n  SHAKE SHAKE  \n   SHAKE IT    ",
  "  BILLIE JEAN  \n   IS NOT MY   \n     LOVER     ",
  " CAUSE THIS IS \n   THRILLER    \n THRILLER NITE ",
  "    BEAT IT    \n    BEAT IT    \n NO ONE WANTS  ",
  " LIKE A PRAYER \n WHEN YOU CALL \n    MY NAME    ",
  " STRIKE A POSE \n    THERES     \n NOTHING TO IT ",
  " SWEET DREAMS  \n  ARE MADE OF  \n     THIS      ",
  " JUST LIKE THE \n WHITE WINGED  \n     DOVE      ",
  " THUNDER ONLY  \n HAPPENS WHEN  \n  ITS RAINING  ",
  "   DONT STOP   \n   BELIEVIN    \n  HOLD ON TO   ",
  "   WHOA WERE   \n   HALF WAY    \n     THERE     ",
  "  HIT ME WITH  \nYOUR BEST SHOT \n   FIRE AWAY   ",
  "    WE WILL    \n    WE WILL    \n   ROCK YOU    ",
  "  ANOTHER ONE  \n   BITES THE   \n     DUST      ",
  "  PURPLE RAIN  \n  PURPLE RAIN  \n  PURPLE RAIN  ",
  "  GIRLS JUST   \n WANT TO HAVE  \n      FUN      ",
  "  TAKE ON ME   \n    TAKE ME    \n      ON       ",
  "    TAINTED    \n     LOVE      \n  OH TAINTED   ",
  "COME ON EILEEN \n  OH I SWEAR   \n WHAT HE MEANS ",
  "   OH MICKEY   \n YOURE SO FINE \n YOURE SO FINE ",
  " WE CAN DANCE  \n  IF WE WANT   \n      TO       ",
  "  LOVE SHACK   \n     BABY      \n  LOVE SHACK   ",
  " MIGHT AS WELL \n     JUMP      \n     JUMP      ",
  " YOU SHOOK ME  \n   ALL NIGHT   \n     LONG      ",
  "  TURN AROUND  \n  BRIGHT EYES  \n  TURN AROUND  ",
  "  I BLESS THE  \n  RAINS DOWN   \n   IN AFRICA   ",
  "  ITS THE EYE  \n OF THE TIGER  \nITS THE THRILL ",
  "    ITS THE    \n     FINAL     \n   COUNTDOWN   ",
  "     SWEET     \n   CAROLINE    \n   BA BA BA    ",
  "HOLD ME CLOSER \n     TINY      \n    DANCER     ",
  "  YOU ARE THE  \n DANCING QUEEN \nYOUNG AND FREE ",
  "   MAMMA MIA   \n   HERE I GO   \n     AGAIN     ",
  "  AH AH AH AH  \n    STAYIN     \n     ALIVE     ",
  "  OH NO NOT I  \n    I WILL     \n    SURVIVE    ",
  "DO YOU REMEMBER\n   THE 21ST    \n OF SEPTEMBER  ",
  "ALL NIGHT LONG \n   ALL NIGHT   \n   ALL NIGHT   ",
  " R E S P E C T \n FIND OUT WHAT \nIT MEANS TO ME ",
  "    IVE GOT    \n SUNSHINE ON A \n  CLOUDY DAY   ",
  "  OH HERE SHE  \n  COMES WATCH  \n    OUT BOY    ",
  "IT STARTED OUT \n    WITH A     \n     KISS      ",
  "   OH MY GOD   \n BECKY LOOK AT \n   HER BUTT    ",
  "    ICE ICE    \n     BABY      \n   TOO COLD    ",
  "  JUMP AROUND  \n  JUMP AROUND  \n JUMP UP JUMP  ",
  "      HEY      \n   MACARENA    \n      AY       ",
  " A LITTLE BIT  \n OF MONICA IN  \n    MY LIFE    ",
  "  TELL ME WHY  \n  AINT NOTHIN  \nBUT A HEARTACHE",
  "  BYE BYE BYE  \n    BYE BYE    \n  DONT WANNA   ",
  " IF YOU WANNA  \n  BE MY LOVER  \n YOU GOTTA GET ",
  " LETS GO GIRLS \n  MAN I FEEL   \n LIKE A WOMAN  ",
  "  ALL I WANT   \n FOR CHRISTMAS \n    IS YOU     ",
  " I WANNA DANCE \n     WITH      \n   SOMEBODY    ",
  "  AND I WILL   \n  ALWAYS LOVE  \n      YOU      ",
  "     START     \n SPREADING THE \n     NEWS      ",
  "   FLY ME TO   \n THE MOON LET  \n ME PLAY AMONG ",
  "NO I DONT WANT \n      NO       \n     SCRUB     ",
  "    DONT GO    \n    CHASING    \n  WATERFALLS   ",
  "  HIT ME BABY  \n   ONE MORE    \n     TIME      ",
  "    OOPS I     \n DID IT AGAIN  \n TO YOUR HEART ",
  " KNOW WHEN TO  \n HOLD EM KNOW  \n WHEN TO FOLD  ",
  "YOU GOTTA FIGHT\n   FOR YOUR    \nRIGHT TO PARTY ",
  "   POUR SOME   \n  SUGAR ON ME  \n  OOH IN THE   ",
  "  UPTOWN GIRL  \n   SHES BEEN   \n LIVING IN HER ",
  "  YOU MAKE MY  \n  DREAMS COME  \n     TRUE      ",
  " SUMMER LOVIN  \nHAD ME A BLAST \n SUMMER NIGHTS ",
  " IM HERE FOR A \n   GOOD TIME   \nNOT A LONG ONE ",
  "   NO ALARMS   \n   NO EMAILS   \n  NO PROBLEM   ",
  "    NAP NOW    \n  HIKE LATER   \n     MAYBE     ",
  "IF LOST FOLLOW \n      THE      \n    SMORES     ",
  "   LESS RUSH   \n   MORE LIFE   \n     ENJOY     ",
  "    LOOK UP    \n  THIS SKY IS  \n     WILD      ",
  "  SLOW NIGHTS  \n  GOOD PEOPLE  \nGREAT MEMORIES ",
  "  DIRT ROADS   \n  CLEAR MINDS  \n HAPPY HEARTS  ",
  " THIS IS YOUR  \n RESET BUTTON  \n    USE IT     ",
  " MEMORIES ARE  \n  BEING MADE   \n     TODAY     ",
  " BREATHE IT IN \n  THIS IS IT   \n   RIGHT NOW   ",
  "  CABIN DAYS   \n   WILD WAYS   \n     ENJOY     ",
  "  AFTER RIVER  \n  BEFORE FIRE  \n  PERFECT DAY  ",
  "   FLOAT THE   \n  BIG SPRINGS  \n     TODAY     ",
  "  YOU MADE IT  \n OUT OF OFFICE \n   FOR REAL    ",
  "  IF I COULD   \n   TURN BACK   \n     TIME      ",
  "DO YOU BELIEVE \n IN LIFE AFTER \n     LOVE      ",
  "  THEY SAY WE  \n   WONT LAST   \nI GOT YOU BABE ",
  "YOU GET NOTHING\n   YOU LOSE    \n GOOD DAY SIR  ",
  " COME WITH ME  \n AND YOULL BE  \n IN A WORLD OF ",
  "THE DANGER MUST\n  BE GROWING   \n FOR THE ROWER ",
  "  WE MADE IT   \n TO THE GREAT  \n    VALLEY     ",
  "LET YOUR HEART \n   GUIDE YOU   \n  IT WHISPERS  ",
  "SOME THINGS YOU\n SEE WITH YOUR \nHEART NOT EYES ",
  " RODEO COWBOYS \n  RIDING FOR   \n   8 SECONDS   ",
  " YOU CAN HAVE  \n  MY HAT BUT   \n  NOT MY SOUL  ",
  "LIFE IS A RODEO\n    RIDE IT    \n   COWBOY UP   ",
  " I COULD HAVE  \nMISSED THE PAIN\n  BUT THEN ID  ",
  " I GOT FRIENDS \n    IN LOW     \n    PLACES     ",
  "  IF TOMORROW  \n  NEVER COMES  \n  SHELL KNOW   ",
  "SAIL YOUR BOAT \nDOWN THE RIVER \n DONT STOP NOW ",
  "     CRAZY     \n  FOR FEELING  \n   SO LONELY   ",
  "IM WALKIN AFTER\n   MIDNIGHT    \n SEARCHIN 4 U  ",
  "  I GOT YOUR   \nPICTURE THAT IS\n   ALL I GOT   ",
  "BILLIE JEAN IS \n NOT MY LOVER  \n SHE JUST SAYS ",
  " CAUSE THIS IS \n   THRILLER    \nTHRILLER NIGHT ",
  "    BEAT IT    \n JUST BEAT IT  \nNO ONE WANTS TO",
  "START WITH THE \n  MAN IN THE   \n    MIRROR     ",
  "I BUILT MY LIFE\n  AROUND YOU   \nBUT TIME MAKES ",
  " CAN THE CHILD \nWITHIN MY HEART\n  RISE ABOVE   ",
  "  AND IF YOU   \n DONT LOVE ME  \nNOW YOULL NEVER",
  "TAKE YR SILVER \n     SPOON     \nDIG YOUR GRAVE ",
  "    NO SOUP    \n    FOR YOU    \n     NEXT      ",
  "WAS THAT WRONG \n SHOULD I NOT  \nHAVE DONE THAT ",
  "NOT THAT THERES\n   ANYTHING    \n WRONG WITH IT ",
  "   YADA YADA   \n     YADA      \nYADA YADA YADA ",
  "     HELLO     \n    NEWMAN     \n...HELLO JERRY ",
  "IT'S NOT A LIE \n    IF YOU     \n  BELIEVE IT   ",
  "  A FESTIVUS   \n    FOR THE    \n  REST OF US   ",
  "    PICK ME    \n   CHOOSE ME   \n    LOVE ME    ",
  "   SERIOUSLY   \n   SERIOUSLY   \n   SERIOUSLY   ",
  " HE'S NOT THE  \n  SUN YOU ARE  \n    YOU ARE    ",
  "ITS A BEAUTIFUL\n  DAY TO SAVE  \n     LIVES     ",
  "  WE ARE THE   \n  LUCKY ONES   \n   MEREDITH    ",
  "    OH GOD     \n  THATS WHAT   \n   SHE SAID    ",
  "  BEARS BEETS  \n  BATTLESTAR   \n   GALACTICA   ",
  "IDENTITY THEFT \n IS NOT A JOKE \n      JIM      ",
  " ASSISTANT TO  \n THE REGIONAL  \n    MANAGER    ",
  "   I DECLARE   \n  BANKRUPTCY   \n MICHAEL SCOTT ",
  "    HOW THE    \n  TURNTABLES   \n  HAVE TURNED  ",
  "     TREAT     \n      YO       \n     SELF      ",
  "    WAFFLES    \n    WAFFLES    \n    WAFFLES    ",
  "    FRIENDS    \n    WAFFLES    \n     WORK      ",
  "     KNOPE     \n      WE       \n      CAN      ",
  "  I LOVE YOU   \nAND I LIKE YOU \n LESLIE KNOPE  ",
  "NEVER HALF ASS \n  TWO THINGS   \n WHOLE ASS ONE ",
  "SIMPLY THE BEST\n  BETTER THAN  \n ALL THE REST  ",
  "  WHATS LOVE   \n   GOT TO DO   \nGOT TO DO WITH ",
  " ROLLIN ROLLIN \n ROLLIN ON THE \n     RIVER     ",
  "    IM YOUR    \nPRIVATE DANCER \n A DANCER FOR  ",
  "  RIVER DEEP   \n MOUNTAIN HIGH \nI LOVE YOU BABY",
  "THE FIRST RULE \n OF FIGHT CLUB \n      IS       ",
  "  YOU DO NOT   \n  TALK ABOUT   \n  FIGHT CLUB   ",
  "IT'S ONLY AFTER\n  WE'VE LOST   \n  EVERYTHING   ",
  "THE THINGS YOU \n  OWN END UP   \n  OWNING YOU   ",
  "  I AM JACK'S  \n COMPLETE LACK \n  OF SURPRISE  ",
  "  ON THE ROAD  \n     AGAIN     \nJUST CANT WAIT ",
  "     CRAZY     \n   FOR LOVIN   \n      YOU      ",
  " MAYBE I DIDNT \n   LOVE YOU    \nQUITE AS OFTEN ",
  "MAMMAS DONT LET\nYR BABIES GROW \nUP 2 B COWBOYS ",
  "IN THE TWILIGHT\nGLOW I SEE HER \nBLUE EYES CRYIN",
  "    I AM A     \n  HIGHWAYMAN   \nALONG THE ROAD ",
  "AND ILL BE BACK\nAGAIN AND AGAIN\n   AND AGAIN   ",
  "    I FLY A    \nSTARSHIP ACROSS\n THE UNIVERSE  ",
  "   LUDICROUS   \n     SPEED     \n      GO       ",
  "   COMB THE    \n    DESERT     \nFOUND ANYTHING ",
  " IM SURROUNDED \n  BY ASSHOLES  \nEVERYBODY STOP ",
  "    MAY THE    \n   SCHWARTZ    \n  BE WITH YOU  ",
  " MAY THE FORCE \n    BE WITH    \n      YOU      ",
  "     LUKE      \n     I AM      \n  YOUR FATHER  ",
  " DO OR DO NOT  \n   THERE IS    \n    NO TRY     ",
  " NEVER TELL ME \n   THE ODDS    \n   HAN SOLO    ",
  "  I LOVE YOU   \n    I KNOW     \n HAN AND LEIA  ",
  "    HELP ME    \nOBI WAN KENOBI \n YR ONLY HOPE  ",
  "   WHAT THE    \n     SMURF     \n  IS GOING ON  ",
  "LA LA LA LA LA \n  LA LA LA LA  \nLA LA LA LA LA ",
  " GOOD MORNING  \n    FELLOW     \n    SMURFS     ",
  "  SMURFTASTIC  \n   DAY TO BE   \n     ALIVE     ",
  "   BILL NYE    \nTHE SCIENCE GUY\n SCIENCE RULES ",
  "   CONSIDER    \n      THE      \n   FOLLOWING   ",
  "    NOW YOU    \n    TRY IT     \n    AT HOME    ",
  "  WE ARE ALL   \n MADE OF STAR  \n     STUFF     ",
  "THE UNIVERSE IS\n     IN US     \n WE ARE IN IT  ",
  "THE GOOD THING \n ABOUT SCIENCE \n  IS ITS TRUE  ",
  "  WE ARE JUST  \n  AN ADVANCED  \nBREED OF MONKEY",
  "ONE SMALL STEP \n  FOR MAN ONE  \n  GIANT LEAP   ",
  "  TO INFINITY  \n  AND BEYOND   \nBUZZ LIGHTYEAR ",
  " LOOK AGAIN AT \n   THAT DOT    \n   THATS US    ",
  "   SOMEWHERE   \n   SOMETHING   \n  INCREDIBLE   ",
  " EARTH IS THE  \n   CRADLE OF   \n   HUMANITY    ",
  "DONT BE SHOCKED\n   WHEN YOUR   \n HISTORY BOOKS ",
  "    IM NOT     \n THROWING AWAY \n    MY SHOT    ",
  "  DO YOU HEAR  \n  THE PEOPLE   \n     SING      ",
  "  I HAVE BEEN  \n  CHANGED FOR  \n     GOOD      ",
  " SOMETHING HAS \nCHANGED WITHIN \n      ME       ",
  "   THE MUSIC   \n OF THE NIGHT  \n  SING FOR ME  ",
  "    NO DAY     \n      BUT      \n     TODAY     ",
  "    AND ALL    \n     THAT      \n     JAZZ      ",
  " CANT BRING ME \n     DOWN      \nDEFYING GRAVITY",
  "  I AM BRAVE   \n I AM BRUISED  \n  THIS IS ME   ",
  "MILLION DREAMS \n  ARE KEEPING  \n   ME AWAKE    ",
  "  WHAT IF WE   \n  REWRITE THE  \n     STARS     ",
  "ITS EVERYTHING \n YOU EVER WANT \n ITS THE SHOW  ",
  "  COME ALIVE   \n  COME ALIVE   \n  GO AND RIDE  ",
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
  // OwnerRez stores phones as an array
  let phoneStr = "";
  if (Array.isArray(guest?.phones) && guest.phones.length > 0) {
    phoneStr = guest.phones[0]?.number || guest.phones[0]?.value || guest.phones[0] || "";
  }
  const digits = String(phoneStr).replace(/\D/g, "");
  return digits.slice(-4) || "0000";
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
// --- Debug for phone numer PIN for guest automation for vestaboard
app.get("/debug", (_req, res) => {
  res.json({
    currentGuest: currentGuest ? "LOADED" : "NULL",
    guestName: currentGuest?.first_name || "none",
    phones: currentGuest?.phones || "NONE",
    calculatedPin: currentGuest ? getGuestPin(currentGuest) : "NO GUEST"
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
