# Migrating to OpenAPI Generator for C# Clients

This document describes how to generate C# API clients from OpenAPI 3.x specifications using OpenAPI Generator as a replacement for the Swagger 2.0-based swagger-csharp-client.

## Why Migrate?

| Feature | swagger-csharp-client | OpenAPI Generator |
|---------|----------------------|-------------------|
| OpenAPI 2.0 (Swagger) | ✓ | ✓ |
| OpenAPI 3.0/3.1 | ✗ | ✓ |
| Java Required | Yes (swagger-codegen) | No (Docker available) |
| Custom Templates | Mustache | Mustache |
| Active Development | Limited | Active |

## Prerequisites

- Docker installed and running
- OpenAPI 3.x specification file (bundled into a single file)

## Quick Start

### 1. Bundle Your OpenAPI Spec (if using multiple files)

If your API spec is split across multiple files, bundle it first:

```bash
# Using redocly
npx @redocly/cli bundle api/my-api.yaml -o api/my-api-spec.yaml

# Or using swagger-pack (for Swagger 2.0)
swagger-pack api/my-api.yaml > api/my-api-spec.yaml
```

### 2. Generate C# Client with Docker

```bash
docker run --rm \
  -v "$(pwd):/local" \
  openapitools/openapi-generator-cli generate \
  -i /local/api/my-api-spec.yaml \
  -g csharp \
  -o /local/output/my-api-client \
  --additional-properties=packageName=MyApiClient,targetFramework=net48
```

### Available Target Frameworks

| Framework | Value |
|-----------|-------|
| .NET Framework 4.7 | `net47` |
| .NET Framework 4.8 | `net48` |
| .NET Standard 2.0 | `netstandard2.0` |
| .NET Standard 2.1 | `netstandard2.1` |
| .NET 8.0 | `net8.0` |
| .NET 9.0 | `net9.0` |

Multiple targets can be specified with semicolons: `net48;netstandard2.0`

## Common Options

### Additional Properties

```bash
--additional-properties=packageName=MyApiClient,targetFramework=net48,packageVersion=1.0.0
```

| Property | Description | Example |
|----------|-------------|---------|
| `packageName` | Name of the generated package | `MyApiClient` |
| `targetFramework` | Target .NET framework | `net48` |
| `packageVersion` | Version of the package | `1.0.0` |
| `sourceFolder` | Source folder for generated code | `src` |
| `nullableReferenceTypes` | Enable nullable reference types | `true` |

### Full Example with All Common Options

```bash
docker run --rm \
  -v "$(pwd):/local" \
  openapitools/openapi-generator-cli generate \
  -i /local/api/auth-device-serv-spec.yaml \
  -g csharp \
  -o /local/output/auth-device-serv-client \
  --additional-properties=packageName=AuthDeviceServClient,targetFramework=net48,packageVersion=1.0.0
```

## Generated Project Structure

```
output/
├── MyApiClient.sln              # Solution file
├── appveyor.yml                 # CI configuration
├── docs/
│   ├── apis/                    # API documentation (markdown)
│   └── models/                  # Model documentation (markdown)
└── src/
    ├── MyApiClient/
    │   ├── Api/                 # API classes
    │   ├── Client/              # HTTP client infrastructure
    │   ├── Model/               # Data models
    │   └── Extensions/          # DI extensions
    └── MyApiClient.Test/        # Unit tests
```

## Using the Generated Client

### With Dependency Injection (Recommended)

```csharp
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using MyApiClient.Api;
using MyApiClient.Client;

var host = Host.CreateDefaultBuilder(args)
    .ConfigureApi((context, services, options) =>
    {
        options.AddApiHttpClients(client =>
        {
            client.BaseAddress = new Uri("https://api.example.com");
        });
    })
    .Build();

var api = host.Services.GetRequiredService<IMyApi>();
var response = await api.GetSomethingAsync();
```

### Configuration via appsettings.json

```json
{
  "ApiClient": {
    "BaseUrl": "https://api.example.com",
    "ApiKey": "your-api-key"
  }
}
```

## Custom Templates

To customize the generated code (e.g., to add ConfigurationManager support):

### 1. Extract Default Templates

```bash
docker run --rm \
  -v "$(pwd):/local" \
  openapitools/openapi-generator-cli author template \
  -g csharp \
  -o /local/templates/csharp
```

### 2. Modify Templates

Edit the Mustache templates in `templates/csharp/` as needed.

### 3. Generate with Custom Templates

```bash
docker run --rm \
  -v "$(pwd):/local" \
  openapitools/openapi-generator-cli generate \
  -i /local/api/my-api-spec.yaml \
  -g csharp \
  -o /local/output/my-api-client \
  -t /local/templates/csharp \
  --additional-properties=packageName=MyApiClient,targetFramework=net48
```

## Differences from swagger-csharp-client

### HTTP Client

- **Old**: RestSharp
- **New**: HttpClient with HttpClientFactory

### Configuration

- **Old**: `ConfigurationManager.AppSettings["PackageName.Host"]`
- **New**: Dependency injection with `IServiceCollection`

### Serialization

- **Old**: Newtonsoft.Json
- **New**: System.Text.Json (can be configured)

## CI/CD Integration

The generated project includes `appveyor.yml` for AppVeyor CI. For other CI systems:

### GitHub Actions Example

```yaml
name: Build C# Client

on:
  push:
    paths:
      - 'api/**'

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Generate C# Client
        run: |
          docker run --rm \
            -v "${{ github.workspace }}:/local" \
            openapitools/openapi-generator-cli generate \
            -i /local/api/my-api-spec.yaml \
            -g csharp \
            -o /local/client \
            --additional-properties=packageName=MyApiClient,targetFramework=net48

      - name: Build Client
        run: dotnet build client/MyApiClient.sln
```

## Resources

- [OpenAPI Generator Documentation](https://openapi-generator.tech/docs/generators/csharp)
- [OpenAPI Generator GitHub](https://github.com/OpenAPITools/openapi-generator)
- [Available Generators](https://openapi-generator.tech/docs/generators)
