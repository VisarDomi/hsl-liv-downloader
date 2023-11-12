import {
    TangoData,
    TokenData,
} from './interfaces.js';
import * as constants from './constants.js';
import * as utils from './utils.js';
import { randomUUID } from 'crypto';

export async function getTangoData() {
    const foregroundId = randomUUID();
    const interactionId = randomUUID();
    let tangoPcValue = constants.EMPTY_STRING;
    let tangoTcValue = constants.EMPTY_STRING;
    let username = constants.EMPTY_STRING;
    const fingerprintId = randomUUID();
    const registerGuestBody = JSON.stringify(constants.getRegisterGuestBody(fingerprintId));
    const registerGuestOptions = {
        method: constants.METHOD_POST,
        headers: {
            [constants.CONTENT_TYPE_KEY]: constants.APPLICATION_JSON_CONTENT_TYPE,
            [constants.FOREGROUND_ID_KEY]: foregroundId,
            [constants.INTERACTION_ID_KEY]: interactionId,
        },
        body: registerGuestBody,
    };
    const registerGuestResponse = await fetch(constants.REGISTER_GUEST_URL, registerGuestOptions);
    registerGuestResponse.headers.forEach((value, key) => {
        if (key === constants.SET_COOKIE_KEY) {
            const equalsIndex = value.indexOf(constants.EQUALS_STRING);
            const cookie_key = value.substring(0, equalsIndex);
            switch (cookie_key) {
                case constants.TANGO_PC_COOKIE_KEY: tangoPcValue = value; break;
                case constants.TANGO_TC_COOKIE_KEY: tangoTcValue = value; break;
            }
        }
    });
    const registGuestResponseBody = await registerGuestResponse.json();
    username = registGuestResponseBody[constants.USERNAME_KEY];

    const tangoData: TangoData = {
        [constants.FOREGROUND_ID_KEY]: foregroundId,
        [constants.INTERACTION_ID_KEY]: interactionId,
        [constants.TANGO_PC_COOKIE_KEY]: tangoPcValue,
        [constants.TANGO_TC_COOKIE_KEY]: tangoTcValue,
        [constants.USERNAME_KEY]: username,
    }

    return tangoData
}

export async function getTokenData(tangoData: TangoData) {
    let tt_value = constants.EMPTY_STRING;
    let ttu_value = constants.EMPTY_STRING;
    let tte_value = constants.EMPTY_STRING;
    const tokenDataCookie = utils.createCookie([tangoData[constants.TANGO_PC_COOKIE_KEY], tangoData[constants.TANGO_TC_COOKIE_KEY]]);
    const tokenDataOptions = {
        method: constants.METHOD_GET,
        headers: {
            [constants.FOREGROUND_ID_KEY]: tangoData[constants.FOREGROUND_ID_KEY],
            [constants.INTERACTION_ID_KEY]: tangoData[constants.INTERACTION_ID_KEY],
            [constants.USERNAME_KEY]: tangoData[constants.USERNAME_KEY],
            [constants.COOKIE_KEY]: tokenDataCookie,
        },
    };
    const tokenDataResponse = await fetch(constants.TOKEN_DATA_URL, tokenDataOptions);
    tokenDataResponse.headers.forEach((value, key) => {
        if (key === constants.SET_COOKIE_KEY) {
            const equalsIndex = value.indexOf(constants.EQUALS_STRING);
            const cookie_key = value.substring(0, equalsIndex);
            switch (cookie_key) {
                case constants.TT_COOKIE_KEY: tt_value = value; break;
                case constants.TTU_COOKIE_KEY: ttu_value = value; break;
                case constants.TTE_COOKIE_KEY: tte_value = value; break;
            }
        }
    });

    const tokenData: TokenData = {
        [constants.TT_COOKIE_KEY]: tt_value,
        [constants.TTU_COOKIE_KEY]: ttu_value,
        [constants.TTE_COOKIE_KEY]: tte_value,
    }

    return tokenData
}

export async function getMasterListUrl(streamer: string, tangoData: TangoData, tokenData: TokenData) {
    const foregroundId = tangoData[constants.FOREGROUND_ID_KEY]
    const interactionId = tangoData[constants.INTERACTION_ID_KEY]
    const username = tangoData[constants.USERNAME_KEY]
    const tangoPcValue = tangoData[constants.TANGO_PC_COOKIE_KEY]
    const tangoTcValue = tangoData[constants.TANGO_TC_COOKIE_KEY]

    const tt_value = tokenData[constants.TT_COOKIE_KEY]
    const ttu_value = tokenData[constants.TTU_COOKIE_KEY]
    const tte_value = tokenData[constants.TTE_COOKIE_KEY]

    const fullCookie = utils.createCookie([tangoPcValue, tangoTcValue, tt_value, ttu_value, tte_value]);
    const batchOptions = {
        method: constants.METHOD_POST,
        headers: {
            [constants.CONTENT_TYPE_KEY]: constants.APPLICATION_JSON_CONTENT_TYPE,
            [constants.FOREGROUND_ID_KEY]: foregroundId,
            [constants.INTERACTION_ID_KEY]: interactionId,
            [constants.USERNAME_KEY]: username,
            [constants.COOKIE_KEY]: fullCookie,
        },
        body: JSON.stringify([streamer]),
    };
    const batchResponse = await fetch(constants.BATCH_URL, batchOptions);
    const batchResponseBody = await batchResponse.json();
    const streamerId = Object.keys(batchResponseBody)[0];
    if (!streamerId) {
        throw new Error(`${utils.getFormattedDate()} ${streamer} is not a correct streamer username. check for typos`)
    }

    const ACCOUNT_ID_URL = constants.getUrlByAccountId(streamerId);
    const accountIdOptions = {
        method: constants.METHOD_GET,
        headers: {
            [constants.FOREGROUND_ID_KEY]: foregroundId,
            [constants.INTERACTION_ID_KEY]: interactionId,
            [constants.USERNAME_KEY]: username,
            [constants.COOKIE_KEY]: fullCookie,
        },
    };
    const accountIdResponse = await fetch(ACCOUNT_ID_URL, accountIdOptions);
    const accountIdResponseBody = await accountIdResponse.json();
    const streamId = Object.keys(accountIdResponseBody.entities.stream)[0];
    if (!streamId) {
        throw new Error(`${utils.getFormattedDate()} ${streamer} is offline or in a paid program.`)
    }
    let masterListUrl = accountIdResponseBody.entities.stream[streamId].playlistUrl;

    return masterListUrl;
}

export async function getTsUrls(masterListUrl: string, tokenData: TokenData) {
    const tt_value = tokenData[constants.TT_COOKIE_KEY]
    const ttu_value = tokenData[constants.TTU_COOKIE_KEY]
    const tte_value = tokenData[constants.TTE_COOKIE_KEY]

    const partialCookie = utils.createCookie([tt_value, ttu_value, tte_value]);
    const partialOptions = {
        method: constants.METHOD_GET,
        headers: {
            [constants.COOKIE_KEY]: partialCookie,
        },
    };
    const masterListResponse = await fetch(masterListUrl, partialOptions);
    const masterListResponseBody = await masterListResponse.text();
    const liveUrl = utils.getLiveUrl(masterListUrl, masterListResponseBody);
    const liveResponse = await fetch(liveUrl, partialOptions);
    const liveResponseBody = await liveResponse.text();
    const tsUrls = utils.getTsUrls(masterListUrl, liveResponseBody);

    return tsUrls;
}
