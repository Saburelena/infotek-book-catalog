import { createApp } from "./app.js";
import { createContainer } from "./container.js";

const container = createContainer();
const app = createApp(container);

export default app;

if (process.env.NODE_ENV !== "production") {
  app.listen(container.config.port, "0.0.0.0", () => {
    console.log(`API server started on port ${container.config.port}`);
  });
}