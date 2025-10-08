#pragma warning disable ASPIREINTERACTION001
#pragma warning disable ASPIREHOSTINGPYTHON001
#pragma warning disable ASPIREPUBLISHERS001
#pragma warning disable ASPIREPUBLISHERS001
using Aspire.Hosting.Publishing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using static Aspire.Hosting.InputType;
const string dashboardOtlpHttpEndpointUrl = "ASPIRE_DASHBOARD_OTLP_HTTP_ENDPOINT_URL";

var builder = DistributedApplication.CreateBuilder(args);


var aiCoreCredentials = builder.AddParameter("ai-core-key", secret:true)
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
    .WithHttpEndpoint(env: "PORT" , port: 3002, targetPort: 3002)
    .WithEnvironment("AICORE_CONFIG", aiCoreCredentials)
    .WithEnvironment("AICORE_RESOURCE_GROUP", "default")
    .WithOtlpExporter();

var mastra =builder
    .AddExecutable("mastra", "npm", "..", "run", "hybrid:mastra")
    .WaitFor(aiCoreProxy)    
    .WithHttpEndpoint(env: "PORT" ,  port: 4111)
    .WithExternalHttpEndpoints()

    .WithEnvironment("OPENAI_BASE_URL", aiCoreProxy.GetEndpoint("http"))
    .WithEnvironment("OPENAI_APIKEY", "dummy-api-key")
    .WithOtlpExporter();






builder.Build().Run();
