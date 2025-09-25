import {createAzure} from "@ai-sdk/azure";

const {OPENAI_BASE_URL, OPENAI_API_KEY} = process.env;
console.log("OPENAI_BASE_URL", OPENAI_BASE_URL);
export const llm=createAzure({
    baseURL: OPENAI_BASE_URL,
    apiKey: OPENAI_API_KEY || "dummy-api-key",
    apiVersion: "2024-06-01-preview",
})