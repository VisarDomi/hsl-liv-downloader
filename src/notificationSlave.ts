import {
    TangoData,
    DiskTangoData,
    TokenData,
    TypeMessage,
    StreamerMessage,
    StreamersMessage,
} from './interfaces.js';
import * as constants from './constants.js';
import * as slaveLogic from './slaveLogic.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';

const checkStreamers = async (streamers: string[]) => {
    try {
        const tangoData: TangoData = await loadTangoData();
        let tokenData: TokenData = await slaveLogic.getTokenData(tangoData);
        let lastRefresh: number = 0;
        for (const streamer of streamers) {
            if (Date.now() - lastRefresh > constants.SHORT_TERM_TOKEN_REFRESH_TIME) {
                tokenData = await slaveLogic.getTokenData(tangoData);
                lastRefresh = Date.now();
            }
            try {
                await slaveLogic.getMasterListUrl(streamer, tangoData, tokenData);
            } catch (error) {
                console.log(error);
                continue; // the streamer is offline, in a paid program, or it's an incorrect username, so we skip this streamer
            }
            const onlineMessage: StreamerMessage = {
                type: constants.ONLINE,
                streamer,
            };
            if (process.send) process.send(onlineMessage);
        }
    } catch (error) {
        console.error(error);
    } finally {
        const finishedCheckingMessage: TypeMessage = {
            type: constants.FINISHED_CHECKING,
        };
        if (process.send) process.send(finishedCheckingMessage);
        process.exitCode = -1;
    }
}

process.on(constants.MESSAGE, (message: StreamersMessage) => {
    if (message.type === constants.CHECK_STATUS) {
        checkStreamers(message.streamers);
    }
});

export function getPath() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const notificationPath = path.resolve(__dirname, __filename);

    return notificationPath;
}

async function loadTangoData(): Promise<TangoData> {
    let tangoData: TangoData;
    try {
        const data = await fs.readFile(constants.TANGO_TOKENS_JSON, constants.UTF8_ENCODING);
        const diskTangoData: DiskTangoData = JSON.parse(data);
        if (Date.now() - diskTangoData.timestamp > constants.LONG_TERM_TOKEN_REFRESH_TIME) {
            console.log(`Refreshing the ${constants.TANGO_TOKENS_JSON} file, just to be safe...`);
            tangoData = await saveTangoData();
        } else {
            const { timestamp, ...diskTangoDataWithoutTimestamp } = diskTangoData;
            tangoData = diskTangoDataWithoutTimestamp;
        }
    } catch (error) {
        console.log(`There's no ${constants.TANGO_TOKENS_JSON} file, creating it now...`);
        tangoData = await saveTangoData();
    }

    return tangoData;
}

async function saveTangoData(): Promise<TangoData> {
    const tangoData: TangoData = await slaveLogic.getTangoData();
    const diskTangoData: DiskTangoData = {
        ...tangoData,
        timestamp: Date.now(),
    };
    await fs.writeFile(constants.TANGO_TOKENS_JSON, JSON.stringify(diskTangoData, null, 4), constants.UTF8_ENCODING);

    return tangoData;
}
