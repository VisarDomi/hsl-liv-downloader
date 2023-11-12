import {
    Fc2Data,
    DiskFc2Data,
    TypeMessage,
    StreamerMessage,
    StreamersMessage,
} from './interfaces.js';
import * as constants from './constants.js';
import * as slaveLogicFc2 from './slaveLogicFc2.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';

const checkStreamers = async (streamers: string[]) => {
    try {
        const fc2Data: Fc2Data = await loadFc2Data();
        for (const streamer of streamers) {
            try {
                const controlUrl = await slaveLogicFc2.getControlUrl(streamer, fc2Data);
                await slaveLogicFc2.getTsUrls(controlUrl, fc2Data, streamer);
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

export function getPath(): string {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const notificationPath = path.resolve(__dirname, __filename);

    return notificationPath;
}

async function loadFc2Data(): Promise<Fc2Data> {
    let fc2Data: Fc2Data;
    try {
        const data = await fs.readFile(constants.FC2_TOKENS_JSON, constants.UTF8_ENCODING);
        const diskFc2Data: DiskFc2Data = JSON.parse(data);
        if (Date.now() - diskFc2Data.timestamp > constants.LONG_TERM_TOKEN_REFRESH_TIME) {
            console.log(`Refreshing the ${constants.FC2_TOKENS_JSON} file, just to be safe...`);
            fc2Data = await saveFc2Data();
        } else {
            const { timestamp, ...diskFc2DataWithoutTimestamp } = diskFc2Data;
            fc2Data = diskFc2DataWithoutTimestamp;
        }
    } catch (error) {
        console.log(`There's no ${constants.FC2_TOKENS_JSON} file, creating it now...`);
        fc2Data = await saveFc2Data();
    }

    return fc2Data;
}

async function saveFc2Data(): Promise<Fc2Data> {
    const fc2Data: Fc2Data = await slaveLogicFc2.getFc2Data();
    const diskFc2Data: DiskFc2Data = {
        ...fc2Data,
        timestamp: Date.now(),
    };
    await fs.writeFile(constants.FC2_TOKENS_JSON, JSON.stringify(diskFc2Data, null, 4), constants.UTF8_ENCODING);

    return fc2Data;
}
