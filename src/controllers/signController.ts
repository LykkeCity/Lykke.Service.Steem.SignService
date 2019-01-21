import { JsonController, Body, Post, BadRequestError } from "routing-controllers";
import { IsArray, IsString, IsNotEmpty, IsBase64 } from "class-validator";
import { fromBase64, toBase64, Settings } from "../common";

const steem = require("steem");

class SignTransactionRequest {

    @IsArray()
    @IsNotEmpty()
    privateKeys: string[];

    @IsBase64()
    @IsNotEmpty()
    @IsString()
    transactionContext: string;
}

class SignTransactionResponse {
    constructor(public signedTransaction: string) {
    }
}

class TransactionContext {
    config: any;
    tx: any;
}

@JsonController("/sign")
export class SignController {

    constructor(private settings: Settings) {
    }

    /**
     * Signs transaction with provided private keys.
     * @param request Private keys and data of transaction to sign.
     */
    @Post()
    async signTransaction(@Body({ required: true }) request: SignTransactionRequest): Promise<SignTransactionResponse> {

        // context actually is a disassembled transaction
        const ctx = fromBase64<TransactionContext>(request.transactionContext);

        // for real transactions real privite keys are required;
        // for simulated transactions (i.e. DW -> HW) we don't have any real action, 
        // but we protect such activities with HW private key
        if (!request.privateKeys.length ||
            !request.privateKeys.every(k => steem.auth.isWif(k)) ||
            (!ctx.tx && request.privateKeys.some(k => !steem.auth.wifIsValid(k, this.settings.SteemSignService.HotWalletActivePublicKey)))) {
            throw new BadRequestError("Invalid private key(s)");
        }

        if (!!ctx.tx) {
            // configure steem-js
            for (const key in ctx.config) {
                if (ctx.config.hasOwnProperty(key)) {
                    steem.config.set(key, ctx.config[key]);
                }
            }

            // convert array of keys to object
            const privateKeys = request.privateKeys.reduce((p: any, c, i) => {
                p[i] = c;
                return p;
            }, {});

            // sign transaction
            const signedTransaction = steem.auth.signTransaction(ctx.tx, privateKeys);

            return new SignTransactionResponse(toBase64(signedTransaction));
        } else {
            // for simulated transactions we use timestamp as tx ID
            return new SignTransactionResponse(toBase64({
                txId: Date.now().toFixed()
            }));
        }
    }
}