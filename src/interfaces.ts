import * as constants from './constants.js';

export interface TangoData {
    [constants.FOREGROUND_ID_KEY]: string,
    [constants.INTERACTION_ID_KEY]: string,
    [constants.USERNAME_KEY]: string,
    [constants.TANGO_PC_COOKIE_KEY]: string;
    [constants.TANGO_TC_COOKIE_KEY]: string;
}

export interface DiskTangoData extends TangoData {
    timestamp: number;
}

export interface TokenData {
    [constants.TT_COOKIE_KEY]: string,
    [constants.TTU_COOKIE_KEY]: string,
    [constants.TTE_COOKIE_KEY]: string,
}

export interface Fc2Data {
    [constants.PHP_COOKIE_KEY]: string,
    [constants.ORT_COOKIE_KEY]: string,
}

export interface DiskFc2Data extends Fc2Data {
    timestamp: number;
}

export interface TypeMessage {
    type: string,
}

export interface StreamersMessage extends TypeMessage {
    streamers: string[],
}

export interface StreamerMessage extends TypeMessage {
    streamer: string,
}

export interface MessageData {
    name: string,
    arguments: Arguments,
    id?: number
}

interface Arguments {
    code?: number,
    playlists?: Array<Playlist>,
    playlists_high_latency?: Array<Playlist>,
    playlists_middle_latency?: Array<Playlist>,
    status?: number,
}

interface Playlist {
    mode: number,
    status: number,
    url: string
}
