import {
    StreamerMessage,
    StreamersMessage,
} from './interfaces.js';
import * as constants from './constants.js';
import * as utils from './utils.js';
import * as streamerSlave from './streamerSlave.js';
import * as notificationSlave from './notificationSlave.js';
import * as streamerSlaveFc2 from './streamerSlaveFc2.js';
import * as notificationSlaveFc2 from './notificationSlaveFc2.js';
import { fork } from 'child_process';
import { promises as fs } from 'fs';
import { watch } from 'fs';
import { setTimeout } from 'timers/promises';

const NOTIFICATION_SLAVE_TANGO_JS_PATH = notificationSlave.getPath();
const STREAMER_SLAVE_TANGO_JS_PATH = streamerSlave.getPath();

let tangoStreamers: string[] = [];

async function watchTangoFile() {
    const data = await fs.readFile(constants.TANGO_STREAMERS_JSON, constants.UTF8_ENCODING);
    tangoStreamers = JSON.parse(data);
    watch(constants.TANGO_STREAMERS_JSON, async (eventType) => {
        if (eventType === constants.CHANGE) {
            console.log(`${utils.getFormattedDate()} Streamers list file changed`);
            try {
                await setTimeout(constants.JSON_EDIT_TIME); // Wait for the file to stabilize
                const data = await fs.readFile(constants.TANGO_STREAMERS_JSON, constants.UTF8_ENCODING);
                tangoStreamers = JSON.parse(data);
            } catch (error) {
                console.error(`${utils.getFormattedDate()} Error reading updated streamers list: ${error}`);
            }
        }
    });
    await checkAndDownloadTango();
}

async function checkAndDownloadTango() {
    const downloadingStreamers: Set<string> = new Set();
    while (true) {
        const checkStatusProcess = fork(NOTIFICATION_SLAVE_TANGO_JS_PATH);
        console.log(`${utils.getFormattedDate()} Checking the status of the tango streamers`);
        const checkStatusMessage: StreamersMessage = {
            type: constants.CHECK_STATUS,
            streamers: tangoStreamers,
        }
        checkStatusProcess.send(checkStatusMessage);
        await new Promise<void>((resolve) => {
            checkStatusProcess.on(constants.MESSAGE, (checkStatusMessage: StreamerMessage) => {
                if (checkStatusMessage.type === constants.ONLINE && downloadingStreamers.has(checkStatusMessage.streamer)) {
                    console.log(`${utils.getFormattedDate()} ${checkStatusMessage.streamer} is already downloading`);
                } else if (checkStatusMessage.type === constants.ONLINE && !downloadingStreamers.has(checkStatusMessage.streamer)) {
                    downloadingStreamers.add(checkStatusMessage.streamer);
                    const downloadProcess = fork(STREAMER_SLAVE_TANGO_JS_PATH);
                    console.log(`${utils.getFormattedDate()} ${checkStatusMessage.streamer} started downloading`);
                    const downloadMessage: StreamerMessage = { type: constants.DOWNLOAD, streamer: checkStatusMessage.streamer };
                    downloadProcess.send(downloadMessage);
                    downloadProcess.on(constants.MESSAGE, (downloadMessage: StreamerMessage) => {
                        if (downloadMessage.type === constants.FINISHED_DOWNLOADING) {
                            console.log(`${utils.getFormattedDate()} ${downloadMessage.streamer} actually finished downloading`);
                            downloadingStreamers.delete(downloadMessage.streamer);
                            downloadProcess.removeAllListeners(constants.MESSAGE);
                            downloadProcess.kill();
                        }
                    });
                } else if (checkStatusMessage.type === constants.FINISHED_CHECKING) {
                    checkStatusProcess.removeAllListeners(constants.MESSAGE);
                    checkStatusProcess.kill();
                    resolve();
                }
            });
        });
    }
}

const NOTIFICATION_SLAVE_FC2_JS_PATH = notificationSlaveFc2.getPath();
const STREAMER_SLAVE_FC2_JS_PATH = streamerSlaveFc2.getPath();

let fc2Streamers: string[] = [];

async function watchFc2File() {
    const data = await fs.readFile(constants.FC2_STREAMERS_JSON, constants.UTF8_ENCODING);
    fc2Streamers = JSON.parse(data);
    watch(constants.FC2_STREAMERS_JSON, async (eventType) => {
        if (eventType === constants.CHANGE) {
            console.log(`${utils.getFormattedDate()} Streamers list file changed`);
            try {
                await setTimeout(constants.JSON_EDIT_TIME); // Wait for the file to stabilize
                const data = await fs.readFile(constants.FC2_STREAMERS_JSON, constants.UTF8_ENCODING);
                fc2Streamers = JSON.parse(data);
            } catch (error) {
                console.error(`${utils.getFormattedDate()} Error reading updated streamers list: ${error}`);
            }
        }
    });
    await checkAndDownloadFc2();
}

async function checkAndDownloadFc2() {
    const downloadingStreamers: Set<string> = new Set();
    while (true) {
        const checkStatusProcess = fork(NOTIFICATION_SLAVE_FC2_JS_PATH);
        console.log(`${utils.getFormattedDate()} Checking the status of the fc2 streamers`);
        const checkStatusMessage: StreamersMessage = {
            type: constants.CHECK_STATUS,
            streamers: fc2Streamers,
        }
        checkStatusProcess.send(checkStatusMessage);
        await new Promise<void>((resolve) => {
            checkStatusProcess.on(constants.MESSAGE, async (checkStatusMessage: StreamerMessage) => {
                if (checkStatusMessage.type === constants.ONLINE && downloadingStreamers.has(checkStatusMessage.streamer)) {
                    console.log(`${utils.getFormattedDate()} ${checkStatusMessage.streamer} is already downloading`);
                } else if (checkStatusMessage.type === constants.ONLINE && !downloadingStreamers.has(checkStatusMessage.streamer)) {
                    downloadingStreamers.add(checkStatusMessage.streamer);
                    const downloadProcess = fork(STREAMER_SLAVE_FC2_JS_PATH);
                    console.log(`${utils.getFormattedDate()} ${checkStatusMessage.streamer} started downloading`);
                    const downloadMessage: StreamerMessage = { type: constants.DOWNLOAD, streamer: checkStatusMessage.streamer };
                    downloadProcess.send(downloadMessage);
                    downloadProcess.on(constants.MESSAGE, (downloadMessage: StreamerMessage) => {
                        if (downloadMessage.type === constants.FINISHED_DOWNLOADING) {
                            console.log(`${utils.getFormattedDate()} ${downloadMessage.streamer} actually finished downloading`);
                            downloadingStreamers.delete(downloadMessage.streamer);
                            downloadProcess.removeAllListeners(constants.MESSAGE);
                            downloadProcess.kill();
                        }
                    });
                } else if (checkStatusMessage.type === constants.FINISHED_CHECKING) {
                    await setTimeout(constants.INACTIVITY_TIME)
                    checkStatusProcess.removeAllListeners(constants.MESSAGE);
                    checkStatusProcess.kill();
                    resolve();
                }
            });
        });
    }
}

// watchTangoFile();
watchFc2File();
