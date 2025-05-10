import dotenv from "dotenv";
dotenv.config();

export const PORT = Number(process.env.PORT) || 3000;
export const ENV = process.env.ENV || "development";
