import { JsonController, Get } from "routing-controllers";
import { APP_NAME, APP_VERSION, ENV_INFO } from "../common";

@JsonController("/isalive")
export class IsAliveController {

    /**
     * Checks if service is alive
     */
    @Get()
    isAlive() {
        return {
            name: APP_NAME,
            version: APP_VERSION,
            env: ENV_INFO
        };
    }
}