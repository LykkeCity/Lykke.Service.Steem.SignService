import "reflect-metadata";
import { Container } from "typedi";
import { createKoaServer, useContainer } from "routing-controllers";
import { loadSettings, Settings, startAppInsights } from "./common";

// DI initialization for routing-controllers
// must go first, before any other action 
useContainer(Container);

startAppInsights();

loadSettings()
    .then(settings => {
        Container.set(Settings, settings);

        const koa = createKoaServer({
            classTransformer: true,
            controllers: [`${__dirname}/controllers/*js`],
            middlewares: [`${__dirname}/middlewares/*js`],
            routePrefix: "/api"
        });

        koa.listen(5000);
    })
    .then(
        _ => console.log("Started"),
        e => console.log(e));