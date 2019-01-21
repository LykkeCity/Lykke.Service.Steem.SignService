import { Container } from "typedi";
import axios from "axios";
import fs from "fs";
import util from "util";
import * as appInsights from "applicationinsights";

const pkg = require("../package.json");

export const APP_NAME = pkg.name;

export const APP_VERSION = pkg.version;

export const ENV_INFO = process.env.ENV_INFO;

export const ADDRESS_SEPARATOR = "$";

export const DUMMY_PRIVATE_KEY = "dummy_private_key";

export enum Encoding {
    base64 = "base64",
    utf8 = "utf8"
};

/**
 * Serializes object to JSON and then encodes result to base64
 * @param obj Object to serialize to JSON and encode to base64
 */
export function toBase64(obj: any): string {
    return Buffer.from(JSON.stringify(obj)).toString(Encoding.base64);
}

/**
 * Converts base64 string to JSON and then parses result to `T`
 * @param str String in base64 encoding
 */
export function fromBase64<T>(str: string): T {
    return JSON.parse(Buffer.from(str, Encoding.base64).toString(Encoding.utf8)) as T;
}

/**
 * Application settings.
 * Defined as `class` instead of `interface` to make DI easier (no need of Token<Service>)
 */
export class Settings {
    SteemSignService: {
        HotWalletAccount: string;
        HotWalletActivePublicKey: string;
    };
}

/**
 * Loads application settings from file or URL as specified in `SettingsUrl` environment variable.
 */
export async function loadSettings(): Promise<Settings> {
    if (process.env.SettingsUrl.startsWith("http")) {
        return (await axios.get<Settings>(process.env.SettingsUrl)).data;
    } else {
        return JSON.parse(await util.promisify(fs.readFile)(process.env.SettingsUrl, Encoding.utf8)) as Settings;
    }
}

export function startAppInsights() {
    if (!process.env["APPINSIGHTS_INSTRUMENTATIONKEY"]) {
        console.warn("APPINSIGHTS_INSTRUMENTATIONKEY is not provided");
        return;
    }

    // init with default configuration
    appInsights.setup()
        .setAutoDependencyCorrelation(true)
        .setAutoCollectRequests(true)
        .setAutoCollectPerformance(true)
        .setAutoCollectExceptions(true)
        .setAutoCollectDependencies(true)
        .setAutoCollectConsole(true)
        .setUseDiskRetryCaching(true)
        .start();

    // register client in DI container
    // so it could be used by services
    Container.set(appInsights.TelemetryClient, appInsights.defaultClient);
}