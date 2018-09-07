import { JsonController, Post } from "routing-controllers";
import { ADDRESS_SEPARATOR, Settings, DUMMY_PRIVATE_KEY } from "../common";
import uuid from "uuid";

@JsonController("/wallets")
export class WalletsController {

    constructor(private settings: Settings) {
    }

    /**
     * Creates a kind of "virtual" wallet in format "{ HotWalletAccount }${ UniqueId }" for using as deposit wallet.
     * While sending funds user must use { HotWalletAccount } as "to" and { UniqueId } as "memo" fields of cash-in transaction action.
     */
    @Post()
    createWallet() {
        return {
            publicAddress: `${this.settings.SteemSignService.HotWalletAccount}${ADDRESS_SEPARATOR}${uuid.v4()}`,
            privateKey: DUMMY_PRIVATE_KEY
        };
    }
}