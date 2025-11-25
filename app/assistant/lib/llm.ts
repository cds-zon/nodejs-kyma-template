import {createAzure, azure} from "@ai-sdk/azure";

const {OPENAI_BASE_URL, OPENAI_API_KEY} = process.env;
export const llm=createAzure({
    baseURL: OPENAI_BASE_URL,
    apiKey: OPENAI_API_KEY || "dummy-api-key",
     apiVersion: "2024-06-01-preview",
})

 
 export default llm;