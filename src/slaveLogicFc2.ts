import {
    MessageData,
    Fc2Data,
} from './interfaces.js';
import * as constants from './constants.js';
import * as utils from './utils.js';
import WebSocket from 'ws';
import { EventEmitter } from "events";
import { setTimeout } from 'timers/promises';

export async function getFc2Data(): Promise<Fc2Data> {
    let phpValue = constants.EMPTY_STRING;
    const phpOptions = {
        method: constants.METHOD_GET,
        headers: {
            [constants.CONTENT_TYPE_KEY]: constants.TEXT_PLAIN_CONTENT_TYPE,
        },
    };
    const phpResponse = await fetch(constants.ADULT_URL, phpOptions);
    phpResponse.headers.forEach((value, key) => {
        if (key === constants.SET_COOKIE_KEY) {
            const equalsIndex = value.indexOf(constants.EQUALS_STRING);
            const cookie_key = value.substring(0, equalsIndex);
            switch (cookie_key) {
                case constants.PHP_COOKIE_KEY: phpValue = value; break;
            }
        }
    });

    let ortValue = constants.EMPTY_STRING;
    const ortCookie = utils.createCookie([phpValue]);
    const ortOptions = {
        method: constants.METHOD_POST,
        headers: {
            [constants.CONTENT_TYPE_KEY]: constants.TEXT_PLAIN_CONTENT_TYPE,
            [constants.COOKIE_KEY]: ortCookie,
        },
    };
    const ortResponse = await fetch(constants.USER_INFO_URL, ortOptions);
    ortResponse.headers.forEach((value, key) => {
        if (key === constants.SET_COOKIE_KEY) {
            const equalsIndex = value.indexOf(constants.EQUALS_STRING);
            const cookie_key = value.substring(0, equalsIndex);
            switch (cookie_key) {
                case constants.ORT_COOKIE_KEY: ortValue = value; break;
            }
        }
    });

    const fc2Data: Fc2Data = {
        [constants.PHP_COOKIE_KEY]: phpValue,
        [constants.ORT_COOKIE_KEY]: ortValue,
    }

    return fc2Data
}

export async function getControlUrl(streamer: string, fc2Data: Fc2Data): Promise<string> {
    const phpValue = fc2Data[constants.PHP_COOKIE_KEY]
    const ortValue = fc2Data[constants.ORT_COOKIE_KEY]

    const phpCookie = utils.createCookie([phpValue]);
    const memberOptions = {
        method: constants.METHOD_POST,
        headers: {
            [constants.CONTENT_TYPE_KEY]: constants.APPLICATION_WWW_CONTENT_TYPE,
            [constants.COOKIE_KEY]: phpCookie,
        },
        body: `channel=1&profile=1&user=1&streamid=${streamer}`,
    };
    const memberResponse = await fetch(constants.MEMBER_API_URL, memberOptions);
    const memberResponseBody = await memberResponse.json();
    const channelId: string = memberResponseBody["data"]["channel_data"]["channelid"]
    const version: string =  memberResponseBody["data"]["channel_data"]["version"]
    if (!version) {
        throw new Error(`${streamer} is not online`)
    }

    const fullCookie = utils.createCookie([phpValue, ortValue, "js-player_size=1"])
    const controlOptions = {
        method: constants.METHOD_POST,
        headers: {
            [constants.CONTENT_TYPE_KEY]: constants.APPLICATION_WWW_CONTENT_TYPE,
            [constants.COOKIE_KEY]: fullCookie,
        },
        body: `channel_id=${channelId}&mode=play&orz=&channel_version=${version}&client_version=2.2.6++%5B1%5D&client_type=pc&client_app=browser_hls&ipv6=`
    };
    const controlResponse = await fetch(constants.CONTROL_URL, controlOptions);
    const controlResponseBody = await controlResponse.json();
    const controlBaseUrl = controlResponseBody["url"]
    const controlToken = controlResponseBody["control_token"]
    const controlUrl = `${controlBaseUrl}?control_token=${controlToken}`

    return controlUrl;
}

export async function getTsUrls(controlUrl: string, fc2Data: Fc2Data, streamer: string): Promise<string[]> {
    let client = new Client(controlUrl, fc2Data, streamer);
    await client.connect();
    const tsUrls: string[] = await new Promise<string[]>((resolve) => {
        client.eventEmitter.once('tsUrlsReady', (tsUrls: string[]) => {
            client.close();
            resolve(tsUrls);
        });
    });
    return tsUrls;
}

class Client {
    controlUrl: string
    fc2Data: Fc2Data
    ws: WebSocket
    id: number
    tsUrls: string[]
    streamer: string
    eventEmitter: EventEmitter
    constructor(controlUrl: string, fc2Data: Fc2Data, streamer: string) {
        this.controlUrl = controlUrl;
        this.fc2Data = fc2Data;
        this.ws = new WebSocket(this.controlUrl)
        this.id = 1;
        this.tsUrls = [];
        this.streamer = streamer;
        this.eventEmitter = new EventEmitter();
    }
    async connect() {
        const phpCookie = utils.createCookie([this.fc2Data.PHPSESSID]);
        const phpOptions = {
            headers: {
                [constants.COOKIE_KEY]: phpCookie,
            },
        };
        this.ws = new WebSocket(this.controlUrl, phpOptions);

        await new Promise((resolve, reject) => {
            this.ws.once('open', resolve);
            this.ws.once('error', reject);
        });
        console.log(`${utils.getFormattedDate()} ${this.streamer} connected to the server`);
        this.ws.on('message', (data) => {
            this.handleMessage(data);
        });
        this.sendMessage();
    }
    sendMessage() {
        const name = "get_hls_information";
        console.log(`${utils.getFormattedDate()} ${this.streamer} Sent the message ${this.id}`)
        const msg: MessageData = {"name": name, "arguments": {}, "id": this.id++};
        this.ws.send(JSON.stringify(msg));
    }
    handleMessage(data: WebSocket.RawData) {
        const messageData: MessageData = JSON.parse(data.toString());
        if (messageData.name === "_response_") {
            this.updateTsUrls(messageData);
        }
    }
    private updateTsUrls(messageData: MessageData) {
        const playlistsHighLatency = messageData!.arguments.playlists_high_latency;
        const filteredPlaylists = playlistsHighLatency!.filter(playlist => playlist.mode < 90);
        const highestQualityPlaylist = filteredPlaylists.reduce((max, playlist) => {
            return (max.mode > playlist.mode) ? max : playlist;
        }, filteredPlaylists[0]);
        this.tsUrls = [highestQualityPlaylist.url];
        this.eventEmitter.emit('tsUrlsReady', this.tsUrls);
    }
    close() {
        if (this.ws) {
            this.ws.close();
            console.log(`${utils.getFormattedDate()} ${this.streamer} closed the connection`)
        }
    }
    getTsUrls() {
        return this.tsUrls;
    }
}
