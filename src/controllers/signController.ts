import { JsonController, Body, Post, BadRequestError } from "routing-controllers";
import { IsArray, IsString, IsNotEmpty, IsBase64 } from "class-validator";
import { Client, PrivateKey, ClientOptions, Transaction } from "dsteem"
import { fromBase64, toBase64, Settings } from "../common";

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
    options: ClientOptions;
    tx: Transaction;
}

@JsonController("/sign")
export class SignController {

    constructor(private settings: Settings) {
    }

    /**
     * Signs transaction with provided private keys or/and with hot wallet private key, if necessary.
     * @param request Private keys and data of transaction to sign.
     */
    @Post()
    async signTransaction(@Body({ required: true }) request: SignTransactionRequest): Promise<SignTransactionResponse> {

        // context actually is a disassembled transaction
        const ctx = fromBase64<TransactionContext>(request.transactionContext);
        
        // extract private keys
        let privateKeys: PrivateKey[] = [];
        try {
            privateKeys = request.privateKeys.map(k => PrivateKey.from(k));
        } catch (e) {
            throw new BadRequestError("Invalid private key(s)");
        }

        // for real transactions real privite keys are required;
        // for simulated transactions (i.e. DW -> HW) we don't have any real action, 
        // but we protect such activities with HW private key
        if (!privateKeys.length || (!ctx.tx && privateKeys.some(k => k.createPublic().toString() != this.settings.SteemSignService.HotWalletActivePublicKey))) {
            throw new BadRequestError("Invalid private key(s)");
        }

        // for simulated transactions we use timestamp as tx ID
        if (!ctx.tx) {
            return new SignTransactionResponse(toBase64({
                txId: Date.now().toFixed()
            }));
        }

        const client = new Client(undefined, ctx.options);
        const signed = client.broadcast.sign(ctx.tx, privateKeys);

        return new SignTransactionResponse(toBase64(signed));
    }
}