import {Memory} from "@mastra/memory";
import {LibSQLStore, LibSQLVector} from "@mastra/libsql";
import { fastembed } from "@mastra/fastembed";
import {env} from "process";
const url=import.meta.url;
console.log(__dirname,url);
export const memory = new Memory({
    embedder: fastembed,
    // Optional storage configuration - libsql will be used by default
    storage: new LibSQLStore({
        url: `file:${env.DATABASE_DIR}/memory.db`,
        // url:  env["ConnectionStrings__mastra-memory"] || "file:mastra_memory.db?mode=memory&cache=shared",
    }),

    // Optional vector database for semantic search
    vector: new LibSQLVector({
        connectionUrl: `file:${env.DATABASE_DIR}/vector.db`
    }),

    // Memory configuration options
    options: {
        // Number of recent messages to include
        lastMessages: 20,

        // Semantic search configuration
        semanticRecall: {
            topK: 3, // Number of similar messages to retrieve
            messageRange: {
                // Messages to include around each result
                before: 2,
                after: 1,
            },
        },

//         // Working memory configuration
//         workingMemory: {
//             enabled: true,
//             template: `
// # User
// - First Name:
// - Last Name:
// `,
//         },

        // Thread configuration
        threads: {
            generateTitle: true, // Enable title generation using agent's model
            // Or use a different model for title generation
            // generateTitle: {
            //   model: openai("gpt-4.1-nano"), // Use cheaper model for titles
            //   instructions: "Generate a concise title based on the initial user message.", // Custom instructions for title
            // },
        },
    },
});
