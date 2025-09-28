import {Memory} from "@mastra/memory";
import {LibSQLStore, LibSQLVector} from "@mastra/libsql";
import { fastembed } from "@mastra/fastembed";
import {env} from "process";
import {PostgresStore, PgVector} from "@mastra/pg";
import { fs } from "@sap/cds/lib/utils/cds-utils";



export const memory = new Memory({
    embedder: fastembed,
    // Optional storage configuration - libsql will be used by default
    storage: getStorage("memory") ,
    // Optional vector database for semantic search
    vector:getVector("vector"),
   
    // Memory configuration options
    options: {
        // Number of recent messages to include
        lastMessages: 20, 
        // Semantic search configuration
        semanticRecall: {
            topK: 5,
            messageRange: 2,
            indexConfig: {
              type: 'hnsw',  
              hnsw: {
                m: 16,// Number of bi-directional links (default: 16)
                efConstruction: 64,// Size of candidate list during construction (default: 64
              },         // Use HNSW for better performance
              metric: 'dotproduct',   // Best for OpenAI embeddings  
              
            },
          }, 
        workingMemory: {
          enabled: true,
          scope: "resource",
        },

        threads: {
            generateTitle: true, 
        },
    },
});





function getStorageParameters() {
    const services = JSON.parse(env.VCAP_SERVICES || "{}");
    const bindingFile="/bindings/db/credentials"
    const binding=fs.existsSync(bindingFile) ? JSON.parse(fs.readFileSync(bindingFile, "utf8")) : null;
    const pgUrl=  env.pg === "true" ? (binding?.uri || services["postgresql-db"]?.[0]?.credentials?.uri) : null;
    const libsqlUrl = env.LIBSQL_DATABASE_URL;
    const libsqlToken = env.LIBSQL_AUTH_TOKEN;
    console.log("storage parameters", pgUrl, libsqlUrl);

    return {
        pgUrl,
        libsqlUrl,
        libsqlToken
    }
}


export function getStorage(dbName: string) {
    const {pgUrl, libsqlUrl, libsqlToken} = getStorageParameters();

    return pgUrl ?
        new PostgresStore({
            connectionString: pgUrl
        } )
        : libsqlUrl ?
        new LibSQLStore({
            url: libsqlUrl,
            authToken: libsqlToken || undefined
        })
        :
        new LibSQLStore({
            url: `file:${env.DATABASE_DIR ?? ''}${dbName}.db`,
        })
}

function getVector(dbName: string) {
    const {pgUrl, libsqlUrl, libsqlToken} = getStorageParameters();

    return pgUrl ?
        new PgVector({
            connectionString: pgUrl
        } )
        : libsqlUrl ?
        new LibSQLVector({
            connectionUrl: libsqlUrl,
            authToken: libsqlToken || undefined
        })
        :
        new LibSQLVector({
            connectionUrl: `file:${env.DATABASE_DIR ?? ''}${dbName}.db`,
            syncUrl: env.SYNC_URL 
        })
}