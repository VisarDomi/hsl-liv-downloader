import * as constants from "./constants.js";

export function createCookie(responseCrumbs: string[]) {
    let cookie = constants.EMPTY_STRING;
    responseCrumbs.forEach(responseCrumb => {
        const requestCrumb = responseCrumb.split(constants.SEMI_COLUMN_STRING)[0];
        cookie += `${requestCrumb}${constants.SEMI_COLUMN_STRING}${constants.SPACE_STRING}`;
    })

    return cookie.trim();
}

function getCinemaApiUrl(masterListUrl: string) {
    return masterListUrl.split(constants.V_2_STRING)[0];
}

function getResponseBodyLines(responseBody: string) {
    return responseBody.split(constants.NEW_LINE_STRING);
}

export function getLiveUrl(masterListUrl: string, masterListResponseBody: string) {
    const CINEMA_API_URL = getCinemaApiUrl(masterListUrl);
    const responseBodyLines = getResponseBodyLines(masterListResponseBody);
    let relativeLiveUrl;
    for (let i = 0; i < responseBodyLines.length; i++) {
        if (responseBodyLines[i].includes(constants.HD_RESOLUTION_STRING)) {
            relativeLiveUrl = responseBodyLines[i + 1];
        }
    }
    const liveUrl = `${CINEMA_API_URL}${relativeLiveUrl}`;

    return liveUrl;
}

export function getTsUrls(masterListUrl: string, liveResponseBody: string) {
    const CINEMA_API_URL = getCinemaApiUrl(masterListUrl);
    const responseBodyLines = getResponseBodyLines(liveResponseBody);
    const tsPaths = responseBodyLines
        .filter(line => line.startsWith(constants.V_2_STRING))
        .map(tsPath => `${CINEMA_API_URL}${tsPath}`);

    return tsPaths;
}

export function getFormattedDate() {
    const now = new Date(Date.now());
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, constants.ZERO_STRING);
    const day = String(now.getDate()).padStart(2, constants.ZERO_STRING);
    const hours = String(now.getHours()).padStart(2, constants.ZERO_STRING);
    const minutes = String(now.getMinutes()).padStart(2, constants.ZERO_STRING);
    const seconds = String(now.getSeconds()).padStart(2, constants.ZERO_STRING);
    const formattedDate = `${year}${constants.MINUS_STRING}${month}${constants.MINUS_STRING}${day}${constants.SPACE_STRING}${hours}${minutes}${seconds}`;

    return formattedDate;
}
