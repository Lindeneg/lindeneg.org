import type {AddressInfo} from "node:net";
import type {Server} from "node:http";
import type {Express} from "express";

export type Served = {url: string; close: () => Promise<void>};

// listens on a random port so router tests can make real http requests
export async function serve(app: Express): Promise<Served> {
    const server = await new Promise<Server>((resolve) => {
        const s = app.listen(0, () => resolve(s));
    });
    const {port} = server.address() as AddressInfo;
    return {
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise((resolve) => server.close(() => resolve())),
    };
}
