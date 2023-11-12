// settings
export const TANGO_DOWNLOAD_FOLDER = "tango-test";
export const FC2_DOWNLOAD_FOLDER = "fc2-test";
export const DOWNLOAD_BUFFER_TIME = 1 * 1000;
export const INACTIVITY_TIME = 60 * 1000;
export const JSON_EDIT_TIME = 10 * 1000;

// token timers in ms
export const SHORT_TERM_TOKEN_REFRESH_TIME = 5 * 1000;
export const LONG_TERM_TOKEN_REFRESH_TIME = 60 * 60 * 1000;

// message related
export const CHANGE = 'change'
export const CHECK_STATUS = 'checkStatus'
export const ONLINE = 'online'
export const DOWNLOAD = 'download'
export const FINISHED_CHECKING = 'finishedChecking'
export const FINISHED_DOWNLOADING = 'finishedDowndloading'
export const MESSAGE = 'message'

// HTTP methods
export const METHOD_GET = "GET"
export const METHOD_POST = "POST"

// URLs
const CADOR_API = "https://proxycador-cdn.tango.me/proxycador/api"
export const REGISTER_GUEST_URL = `${CADOR_API}/registerGuest/v1`
export const TOKEN_DATA_URL = `${CADOR_API}/public/v1/live/stream/v1/tokenData`
export const BATCH_URL = `${CADOR_API}/public/v1/profiles/v2/batch?basicProfile=true&liveStats=false&followStats=false`
export const getUrlByAccountId = (accountId: string) => `${CADOR_API}/public/v1/live/feeds/v1/byAccountId?accountId=${accountId}`
export const WATCH_URL = `${CADOR_API}/public/v1/live/stream/v2/watch?requestId=`
export const ADULT_URL = `https://live.fc2.com/adult/`
export const USER_INFO_URL = `https://live.fc2.com/api/userInfo.php`
export const MEMBER_API_URL = `https://live.fc2.com/api/memberApi.php`
export const CONTROL_URL = `https://live.fc2.com/api/getControlServer.php`

// common words
export const EMPTY_STRING = ""
export const EQUALS_STRING = "="
export const SEMI_COLUMN_STRING = ";"
export const SPACE_STRING = " "
export const NEW_LINE_STRING = '\n'
export const HD_RESOLUTION_STRING = 'RESOLUTION=1280x720'
export const V_2_STRING = '/v2/'
export const SLASH_STRING = '/'
export const UNDERSCORE_STRING = '_'
export const TS_EXTENSION_STRING = '.ts'
export const MINUS_STRING = '-'
export const DOUBLE_DOT_STRING = '..'
export const ZERO_STRING = '0'

// json file names
export const TANGO_STREAMERS_JSON = 'tangoStreamers.json'
export const FC2_STREAMERS_JSON = 'fc2Streamers.json'
export const TANGO_TOKENS_JSON = 'tangoTokens.json'
export const FC2_TOKENS_JSON = 'fc2Tokens.json'

// encoding
export const UTF8_ENCODING = 'utf8'

// cookie key names
export const TANGO_PC_COOKIE_KEY = "Tango-PC"
export const TANGO_TC_COOKIE_KEY = "Tango-TC"
export const TT_COOKIE_KEY = "tt"
export const TTU_COOKIE_KEY = "ttu"
export const TTE_COOKIE_KEY = "tte"
export const PHP_COOKIE_KEY = "PHPSESSID"
export const ORT_COOKIE_KEY = "l_ortkn"

// header key names
export const USERNAME_KEY = 'username'
export const FOREGROUND_ID_KEY = 'foreground-id'
export const INTERACTION_ID_KEY = 'interaction-id'
export const COOKIE_KEY = 'Cookie'
export const SET_COOKIE_KEY = 'set-cookie'
export const CONTENT_TYPE_KEY = 'Content-Type'

// content types
export const APPLICATION_JSON_CONTENT_TYPE = 'application/json'
export const TEXT_PLAIN_CONTENT_TYPE = 'text/plain;charset=UTF-8'
export const APPLICATION_WWW_CONTENT_TYPE = 'application/x-www-form-urlencoded; charset=UTF-8'

// objects
export const getRegisterGuestBody = (fingerprintId: string) => ({
    "clientCapabilities": "device.linking,tcalttext,acme.v1,tc21,tc.stranger,groupmessage,ndigit.sms.validation,social.v6,live.social.notification:1,live.social.private,live.social.private:2,live.social.pullevents,externalmessage",
    "fingerprint": fingerprintId,
    "locale": "en",
    "osVersion": "10 (Chrome-118)",
    "clientVersion": "9.20.5-5c04689-202311021439"
})
