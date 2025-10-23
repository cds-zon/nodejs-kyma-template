#pragma warning disable ASPIREINTERACTION001
#pragma warning disable ASPIREHOSTINGPYTHON001
#pragma warning disable ASPIREPUBLISHERS001
#pragma warning disable ASPIREPUBLISHERS001
using static Aspire.Hosting.InputType;
using System.Text.Json;

const string dashboardOtlpHttpEndpointUrl = "ASPIRE_DASHBOARD_OTLP_HTTP_ENDPOINT_URL";

// VCAP_SERVICES fix temporarily disabled due to compilation issues

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
    .AddExecutable("agents", "npm", "..", "run", "hybrid:mastra")
    .WaitFor(aiCoreProxy)
    .WithHttpEndpoint(env: "PORT", port: 3001, targetPort: 4001)
    .WithEnvironment("OPENAI_BASE_URL", aiCoreProxy.GetEndpoint("http"))
    .WithEnvironment("OPENAI_APIKEY", "dummy-api-key")
    .WithEnvironment("CDS_REQUIRES_AUTH_KIND", "ias")
    .WithOtlpExporter();

Console.WriteLine(mastra.GetEndpoint("http"));

var agentsAppRouter = builder
    .AddExecutable("agents-router", "npm", "..", "run", "hybrid:approuter", "--", "--", "--port", "6001")
    .WithHttpEndpoint(port: 5001, targetPort: 6001)
    .WithExternalHttpEndpoints()
    .WithOtlpExporter()
    .WithEnvironment("VCAP_SERVICES", Environment.GetEnvironmentVariable("VCAP_SERVICES"))
    .WithEnvironment("DESTINATION_HOST_PATTERN", "https://^(.*).euw.devtunnels.ms$")
    .WithEnvironment("destinations", JsonSerializer.Serialize(new[]
    {
        new { name = "srv-api", url = "http://localhost:4001", forwardAuthToken = true },
    }))
    .WithEnvironment("CORS", """"
     [
        {
          "allowedOrigin":[
                            {
                                "host":"http://localhost:5001",
                                "protocol":"https"
                            },
                            {
                                "host":"http://localhost:5002",
                                "protocol":"https"
                            }
                          ],
          "allowedCredentials": true,
          "uriPattern": "^/.*$",
          "allowedHeaders": [
            "Authorization",
            "Content-Type",
            "approuter-authorization",
            "Cache-Control",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers",
            "x-approuter-authorization",
            "*"
          ],
          "allowedMethods": [
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "OPTIONS"
          ]
        }
      ]
    """")
    ;
    
mastra.WithParentRelationship(agentsAppRouter);

var assistant = builder
    .AddExecutable("assistant", "npm", "..", "run", "hybrid:assistant")
    .WaitFor(agentsAppRouter)
    .WithEnvironment("OPENAI_BASE_URL", aiCoreProxy.GetEndpoint("http"))
    .WithEnvironment("OPENAI_APIKEY", "dummy-api-key")
    .WithEnvironment("OPENAI_BASE_URL", aiCoreProxy.GetEndpoint("http"))
    .WithEnvironment("OPENAI_APIKEY", "dummy-api-key")
     .WithEnvironment("AGENTS_BASE_URL", agentsAppRouter.GetEndpoint("http"))

    .WithEnvironment("NEXT_PUBLIC_AGENTS_BASE_URL", "http://localhost:4001")
    .WithEnvironment("NEXT_PUBLIC_AUTH_TYPE", "ias")
    .WithHttpEndpoint(env: "PORT", port:  3002, targetPort: 4002)
    .WithExternalHttpEndpoints()
    .WithOtlpExporter();


var assistantApp = builder
    .AddExecutable("assistant-router", "npm", "..", "run", "hybrid:approuter" ,"--","--", "--port", "6002")
    .WaitFor(assistant)
    .WithHttpEndpoint(port: 5002, targetPort: 6002)
    .WithExternalHttpEndpoints()
    .WithEnvironment("destinations", JsonSerializer.Serialize(new[]
    {
        new { name = "srv-api", url = "http://localhost:4002", forwardAuthToken = true },
    }))
    .WithEnvironment("DESTINATION_HOST_PATTERN", "https://^(.*).euw.devtunnels.ms$")
    .WithEnvironment("NODE_ENV", "development")
    .WithOtlpExporter()
    .WithEnvironment("CORS", """"
     [
        {
          "allowedOrigin":[
                            {
                                "host":"http://localhost:5001",
                                "protocol":"https"
                            },
                            {
                                "host":"http://localhost:5002",
                                "protocol":"https"
                            }
                          ],
          "allowedCredentials": true,
          "uriPattern": "^/.*$",
          "allowedHeaders": [
            "Authorization",
            "Content-Type",
            "approuter-authorization",
            "Cache-Control",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers",
            "x-approuter-authorization",
            "*"
          ],
          "allowedMethods": [
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "OPTIONS"
          ]
        }
      ]
    """")
    ;

assistant.WithParentRelationship(assistantApp);

builder.Build().Run();



 