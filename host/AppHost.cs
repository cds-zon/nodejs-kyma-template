#pragma warning disable ASPIREINTERACTION001
#pragma warning disable ASPIREHOSTINGPYTHON001
#pragma warning disable ASPIREPUBLISHERS001
#pragma warning disable ASPIREPUBLISHERS001
using Aspire.Hosting.Publishing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using static Aspire.Hosting.InputType;
using System.Text.Json;
const string dashboardOtlpHttpEndpointUrl = "ASPIRE_DASHBOARD_OTLP_HTTP_ENDPOINT_URL";

var builder = DistributedApplication.CreateBuilder(args);


var aiCoreCredentials = builder.AddParameter("ai-core-key", secret: true)
    .WithDescription("SAP AI Core credentials JSON (upload or paste)")
    .WithCustomInput(p => new()
    {
        Name = p.Name,
        InputType = InputType.Text,
        Label = p.Name,
        Placeholder = "Paste AI Core credentials JSON or upload key file",
        Description = p.Description
    }).WithDescription("AI Core credentials in JSON format");

var aiCoreProxy = builder.AddContainer("ai-core-proxy", "llm/sap-ai-proxy:latest")
    .WithImageRegistry("scai-dev.common.repositories.cloud.sap")
    .WithHttpEndpoint(env: "PORT", port: 3002, targetPort: 4000)
    .WithEnvironment("AICORE_CONFIG", aiCoreCredentials)
    .WithEnvironment("AICORE_RESOURCE_GROUP", "default")
    .WithOtlpExporter();

var mastra = builder
    .AddExecutable("mastra", "npm", "..", "run", "hybrid:mastra")
    .WaitFor(aiCoreProxy)
    .WithHttpEndpoint(env: "PORT", port: 3001, targetPort: 4001)
    .WithEnvironment("OPENAI_BASE_URL", aiCoreProxy.GetEndpoint("http"))
    .WithEnvironment("OPENAI_APIKEY", "dummy-api-key")
    .WithOtlpExporter();

Console.WriteLine(mastra.GetEndpoint("http").ToString());

var mastraApp = builder
    .AddContainer("mastra-app", "sapse/approuter", "20.7.0")
    .WithImageRegistry("docker.io")
    // .AddExecutable("mastra-app", "npm", "..", "run", "hybrid:approuter" ,"--","--", "--port", "6001")
    .WaitFor(mastra)
    .WithHttpEndpoint(port: 5001, targetPort: 5000)
    .WithExternalHttpEndpoints()
    .WithOtlpExporter()
    .WithBindMount(source:"./default-env.json", target: "/app/default-env.json")
    .WithEnvironment("VCAP_SERVICES", Environment.GetEnvironmentVariable("VCAP_SERVICES"))
    // .WithEnvironment("DESTINATION_HOST_PATTERN", "https://^(.*).euw.devtunnels.ms$")
    .WithEnvironment("destinations", JsonSerializer.Serialize(new[]
    {
        new { name = "mastra-api", url = "https://h1q3hv0l-3001.euw.devtunnels.ms", forwardAuthToken = true },
        new { name = "assistant-api", url = "https://h1q3hv0l-3002.euw.devtunnels.ms", forwardAuthToken = true },
    }))
    .WithBindMount(source:"../app/mastra/xs-app.json", target: "/app/xs-app.json");
    
builder.AddDevTunnel("mastra-api")
       .WithReference(mastraApp)
       .WithAnonymousAccess();

mastra.WithParentRelationship(mastraApp);

var assistant = builder
    .AddExecutable("assistant", "npm", "..", "run", "hybrid:assistant")
    .WaitFor(mastraApp)
    .WithEnvironment("OPENAI_BASE_URL", aiCoreProxy.GetEndpoint("http"))
    .WithEnvironment("OPENAI_APIKEY", "dummy-api-key")
    .WithEnvironment("OPENAI_BASE_URL", aiCoreProxy.GetEndpoint("http"))
    .WithEnvironment("OPENAI_APIKEY", "dummy-api-key")
    .WithEnvironment("NEXT_PUBLIC_ASSISTANT_BASE_URL", $"{mastraApp.GetEndpoint("http")}/chat")
    .WithHttpEndpoint(env: "PORT", port:  4002)
    .WithExternalHttpEndpoints()
    
    .WithOtlpExporter();


var assistantApp = builder
    .AddExecutable("assistant-app", "npm", "..", "run", "hybrid:approuter" ,"--","--", "--port", "6002")
    .WaitFor(assistant)
    .WithHttpEndpoint(port: 5002, targetPort: 6002)
    .WithExternalHttpEndpoints()
    // .WithEnvironment("VCAP_SERVICES", Environment.GetEnvironmentVariable("VCAP_SERVICES"))
    .WithEnvironment("destinations", JsonSerializer.Serialize(new[]
    {
        new { name = "assistant-api", url = "http://localhost:4002", forwardAuthToken = true }
    }))
    .WithEnvironment("DESTINATION_HOST_PATTERN", "https://^(.*).euw.devtunnels.ms$")
    .WithEnvironment("NODE_ENV", "development")
    .WithOtlpExporter()
    .WithEnvironment("XS_APP_CONFIG", """"""    
        {
            "authenticationMethod": "route",
            "routes": [
                {
                "source": "^/favicon\\.(ico|svg|png|gif)$",
                "target": "/favicon.$1",
                "localDir": ".",
                "cacheControl": "public, max-age=86400",
                "csrfProtection": false
                },
                {
                "source": "(.*)",
                "target": "$1",
                "destination": "*",
                "csrfProtection": false,
                "authenticationType": "ias"
                }
            ],
            "websockets": {
                "enabled": true
            },
            "login": {
                "callbackEndpoint": "/login/callback?authType=ias"
            },
            "logout": {
                "logoutEndpoint": "/logout",
                "logoutPage": "/logout.html"
            }
        }
    """""")
   ;

assistant.WithParentRelationship(assistantApp);


builder.Build().Run();



/* //approuter with a container 
 
var assistantApp = builder
    .AddContainer("assistant-app", "sapse/approuter", "20.7.0")
   .WithImageRegistry("docker.io")
    .WithEnvironment("VCAP_SERVICES", Environment.GetEnvironmentVariable("VCAP_SERVICES"))
    .WaitFor(assistant)
    .WithHttpEndpoint(port: 5002, targetPort: 5000)
    .WithExternalHttpEndpoints()
    .WithBindMount("../app/assistant/xs-app.json", "/app/xs-app.json")
    .WithBindMount("./default-env.json", "/app/default-env.json")
    .WithLocalhostHostsFromHost()

*/




