import {
    Fc2Data,
    StreamerMessage,
} from './interfaces.js';
import * as constants from './constants.js';
import * as utils from './utils.js';
import * as slaveLogicFc2 from './slaveLogicFc2.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { setTimeout } from 'timers/promises';
import { promises as fs } from 'fs';

const download = async (streamer: string) => {
    const tsPath = getDestinationTsPath(streamer);
    let fileHandle = await fs.open(tsPath, 'a');
    fileHandle.close()
    try {
        const tsUrlsData: Map<string, boolean> = new Map();
        let fc2Data: Fc2Data;
        let controlUrl: string;
        let lastWrite: number = 0;
        let firstTime = true;
        // while (true) {
            fileHandle = await fs.open(tsPath, 'a');
            if (firstTime) {
                fc2Data = await slaveLogicFc2.getFc2Data();
                controlUrl = await slaveLogicFc2.getControlUrl(streamer, fc2Data);
            }
            const tsUrls: string[] = await slaveLogicFc2.getTsUrls(controlUrl!, fc2Data!, streamer);
            for (const tsUrl of tsUrls) {
                if (!tsUrlsData.has(tsUrl)) {
                    tsUrlsData.set(tsUrl, false);
                }
            }
            for (const [tsUrl, downloaded] of tsUrlsData) {
                if (!downloaded) {
                    const tsResponse = await fetch(tsUrl);
                    const tsBuffer = await tsResponse.arrayBuffer();
                    const buffer = Buffer.from(tsBuffer);
                    await fileHandle.write(buffer);
                    tsUrlsData.set(tsUrl, true);
                    lastWrite = Date.now();
                }
            }
            await fileHandle.close();
        //     if (lastWrite === 0) break;
        //     if (Date.now() - lastWrite > constants.INACTIVITY_TIME) break;
        //     await setTimeout(constants.DOWNLOAD_BUFFER_TIME);
        // }
    } catch (error) {
        console.error(error);
        fileHandle.close();
    } finally {
        const stats = await fs.stat(tsPath);
        if (stats.size === 0) await fs.unlink(tsPath);
        console.log(`${utils.getFormattedDate()} ${streamer} sends a message to finish downloading`);
        const finishedDownloadingMessage: StreamerMessage = {
            type: constants.FINISHED_DOWNLOADING,
            streamer,
        };
        if (process.send) process.send(finishedDownloadingMessage);
        process.exitCode = 1;
    }
}

process.on(constants.MESSAGE, (message: StreamerMessage) => {
    if (message.type === constants.DOWNLOAD) {
        download(message.streamer)
    }
});

function getDestinationTsPath(streamer: string): string {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const tsFilename = `${utils.getFormattedDate()}${constants.SPACE_STRING}${streamer}${constants.TS_EXTENSION_STRING}`;
    const destinationTsPath = path.resolve(__dirname, constants.DOUBLE_DOT_STRING, constants.DOUBLE_DOT_STRING, constants.FC2_DOWNLOAD_FOLDER, tsFilename);

    return destinationTsPath;
}

export function getPath(): string {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const streamerPath = path.resolve(__dirname, __filename);

    return streamerPath;
}
