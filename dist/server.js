import app from "./app.js";
import config from "./config/index.js";
import { intDB } from "./db/index.js";
const main = () => {
    intDB();
    app.listen(config.port, () => {
        console.log(`Example app listening on port ${config.port}`);
    });
};
main();
//# sourceMappingURL=server.js.map