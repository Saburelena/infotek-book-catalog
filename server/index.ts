import { createApp } from "./app.js";
import { createContainer } from "./container.js";

const container = createContainer();
const app = createApp(container);

app.listen(container.config.port, "0.0.0.0");
