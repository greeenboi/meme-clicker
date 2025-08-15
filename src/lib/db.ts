import { init } from "@instantdb/react";
import schema from "../instant.schema";

const APP_ID = import.meta.env.VITE_INSTANT_APP_ID as string;

export const db = init({
	appId: APP_ID,
	schema,
});

export default db;
