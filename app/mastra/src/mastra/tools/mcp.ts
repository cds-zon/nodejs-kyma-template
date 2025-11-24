import {MCPClient} from '@mastra/mcp';
import {env} from 'process';
import {OAuthClientProvider} from '@modelcontextprotocol/sdk/client/auth.js'
import {
    StreamableHTTPClientTransport,
    StreamableHTTPReconnectionOptions
} from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import {FetchLike, Transport} from '@modelcontextprotocol/sdk/shared/transport.js'
import {
    alwaysProvider,
    alwaysSubscriber,
    Destination,
    getAllDestinationsFromDestinationService,
    
    getDestination, getDestinationFromServiceBinding,
    isHttpDestination,
    useOrFetchDestination
} from '@sap-cloud-sdk/connectivity'
import {executeHttpRequest, Method} from '@sap-cloud-sdk/http-client'
import {
    OAuthClientInformationMixed,
    OAuthTokens,
    AuthorizationServerMetadata
} from '@modelcontextprotocol/sdk/shared/auth.js';
import {RuntimeContext} from '@mastra/core/runtime-context';
import {Mastra} from '@mastra/core';
import cds from '@sap/cds';
import {CDSUser} from '../auth/interfaces';

function getMCPServerUrl(): string {
    // Check environment variable first
    if (env.MCP_SERVER_URL) {
        return env.MCP_SERVER_URL;
    }

    // Check VCAP_SERVICES for bound MCP service
    if (env.VCAP_SERVICES) {
        try {
            const services = JSON.parse(env.VCAP_SERVICES);
            const mcpService = services['mcp-server']?.[0] || services['user-provided']?.find((s: any) => s.name?.includes('mcp'));
            if (mcpService?.credentials?.url) {
                return mcpService.credentials.url;
            }
        } catch (error) {
            console.warn('Failed to parse VCAP_SERVICES for MCP URL:', error);
        }
    }

    // Check service binding file (Kubernetes)
    const bindingFile = "/bindings/mcp/credentials";
    try {
        const fs = require('fs');
        if (fs.existsSync(bindingFile)) {
            const binding = JSON.parse(fs.readFileSync(bindingFile, "utf8"));
            if (binding.url) {
                return binding.url;
            }
        }
    } catch (error) {
        console.warn('Failed to read MCP binding file:', error);
    }

    // Default fallback - for development
    console.log('Using default MCP server URL - configure MCP_SERVER_URL environment variable for production');
    return "https://gitmcp.io/zon-cx/mcp-identity"
}


export async function mcpClient   ({mastra, runtimeContext}: {
    runtimeContext: RuntimeContext<{user: CDSUser | undefined; destination?: string;}>;
    mastra?: Mastra;
})
{
    // await debugDestinations(runtimeContext);

    console.log("Initializing MCP Client...");
    const destination = (await useOrFetchDestination({
        destinationName:  runtimeContext.get("destination") || "task-mcp",
        jwt: runtimeContext.get("user")?.authInfo?.token.jwt,
        
        // selectionStrategy: ,
    }))|| {
        name: "mcp-example",
        url: getMCPServerUrl(),
    };
    
    console.log("MCP Destination:", destination.authTokens);
    
    if(!isHttpDestination(destination)){
        throw new Error("Destination is not an HTTP destination");
    }
    
    return new MCPClient({
        id: `mastra-mcp-${Date.now()}`, // Unique ID to prevent multiple initialization error
        servers: {
            tools: {
                url: new URL(destination.url),
                // authProvider: new DestinationAuthProvider(destination),
                requestInit: {
                    headers: {
                        ...destination.headers || {},
                        ...destination.authTokens?.filter(token=> token.http_header).reduce((acc, curr) => ({ 
                            ...acc, 
                            [curr.http_header.key]: curr.http_header.value
                        }), {} as Record<string, string>) || {}
                    }
                }
            }
        },
    });
}

export async function tools  ({mastra, runtimeContext}: {
    runtimeContext: RuntimeContext;
    mastra?: Mastra;
})   {
    const client = await mcpClient({mastra, runtimeContext});
    return client.getTools();
};

class DestinationAuthProvider implements OAuthClientProvider {
    constructor(public user: CDSUser | undefined) {

    }

    get redirectUrl(): string | URL {
        throw new Error('Method not implemented.');
    }

    get clientMetadata(): {
        redirect_uris: string[];
        jwks_uri?: string | undefined;
        scope?: string | undefined;
        token_endpoint_auth_method?: string | undefined;
        grant_types?: string[] | undefined;
        response_types?: string[] | undefined;
        client_name?: string | undefined;
        client_uri?: string | undefined;
        logo_uri?: string | undefined;
        contacts?: string[] | undefined;
        tos_uri?: string | undefined;
        policy_uri?: string | undefined;
        jwks?: any;
        software_id?: string | undefined;
        software_version?: string | undefined;
        software_statement?: string | undefined;
    } {
        throw new Error('Method not implemented.');
    }

    state?(): string | Promise<string> {
        throw new Error('Method not implemented.');
    }

    clientInformation(): OAuthClientInformationMixed | undefined | Promise<OAuthClientInformationMixed | undefined> {
        throw new Error('Method not implemented.');
    }

    saveClientInformation?(clientInformation: OAuthClientInformationMixed): void | Promise<void> {
        throw new Error('Method not implemented.');
    }

    async tokens():  Promise<OAuthTokens | undefined> {
        const destination = await useOrFetchDestination({
            destinationName: "mcp-example",
            jwt: this.user?.authInfo?.token.jwt
            // selectionStrategy: ,
        });
        
        const authTokens = destination?.authTokens;
        if (authTokens && authTokens.length > 0) {
            const authToken = authTokens[0];
            if (authToken.error) {
                throw new Error(`Error retrieving auth token for destination '${destination.name}': "${authToken.error}"`);
            }
            return {
                access_token: authToken.value,
                token_type: authToken.type,
                
             };
        }
        return undefined; 
    }

    saveTokens(tokens: OAuthTokens): void | Promise<void> {
        throw new Error('Method not implemented.');
    }

    redirectToAuthorization(authorizationUrl: URL): void | Promise<void> {
        throw new Error('Method not implemented.');
    }

    saveCodeVerifier(codeVerifier: string): void | Promise<void> {
        throw new Error('Method not implemented.');
    }

    codeVerifier(): string | Promise<string> {
        throw new Error('Method not implemented.');
    }

    addClientAuthentication?(headers: Headers, params: URLSearchParams, url: string | URL, metadata?: AuthorizationServerMetadata): void | Promise<void> {
        throw new Error('Method not implemented.');
    }

    validateResourceURL?(serverUrl: string | URL, resource?: string): Promise<URL | undefined> {
        throw new Error('Method not implemented.');
    }

    invalidateCredentials?(scope: 'all' | 'client' | 'tokens' | 'verifier'): void | Promise<void> {
        throw new Error('Method not implemented.');
    }

}
 
export default mcpClient;
