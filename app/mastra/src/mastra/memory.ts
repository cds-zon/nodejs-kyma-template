import {Memory} from "@mastra/memory";
import {LibSQLStore, LibSQLVector} from "@mastra/libsql";
import { fastembed } from "@mastra/fastembed";
import {env} from "process";
import {PostgresStore, PgVector} from "@mastra/pg";
import { fs } from "@sap/cds/lib/utils/cds-utils";
const url=import.meta.url;
console.log(__dirname,url)

const services = JSON.parse(env.VCAP_SERVICES || "{}");
const bindingFile="/bindings/db/credentials"
const binding=fs.existsSync(bindingFile) ? JSON.parse(fs.readFileSync(bindingFile, "utf8")) : null;
const pgUrl=  env.pg && (binding?.uri || services["postgresql-db"]?.[0]?.credentials?.uri);
console.log("pgUrl", pgUrl);
export const memory = new Memory({
    embedder: fastembed,
    // Optional storage configuration - libsql will be used by default
    storage: pgUrl ?
        new PostgresStore({
            connectionString: pgUrl
        } )
        :
     new LibSQLStore({
        url: `file:${env.DATABASE_DIR}/memory.db`,
        
        // url:  env["ConnectionStrings__mastra-memory"] || "file:mastra_memory.db?mode=memory&cache=shared",
    }),

    // Optional vector database for semantic search
    vector:
     pgUrl ?
        new PgVector({
            connectionString: pgUrl
        } )
        :
     new LibSQLVector({
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
        workingMemory: {
          enabled: true,

//             template: `
// # User
// - First Name:
// - Last Name:
// `,
        },

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
