import dotenv from "dotenv";
import { createApp } from "./app.js";

dotenv.config({ quiet: true });

const port = Number(process.env.PORT || 4000);
const app = createApp();

app.listen(port, "127.0.0.1", () => {
  console.log(`Ber Car API is running on http://127.0.0.1:${port}`);
});
