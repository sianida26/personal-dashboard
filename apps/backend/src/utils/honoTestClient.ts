import { testClient } from "hono/testing";
import { appRoutes } from "..";

const client = testClient(appRoutes);

export default client;
