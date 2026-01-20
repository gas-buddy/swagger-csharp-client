# GasBuddy Custom C# Templates for OpenAPI Generator

Custom Mustache templates for OpenAPI Generator that add `ConfigurationManager.AppSettings` support for .NET Framework projects.

## Features

- **Configuration-driven host**: Read API base URL from `app.config` or `web.config`
- **Configuration-driven API key**: Read API key from `app.config` or `web.config`
- **Fallback support**: Falls back to default values if config not present

## Configuration Keys

The templates use the following app settings keys:

| Key | Description | Example |
|-----|-------------|---------|
| `{PackageName}.Host` | Base URL of the API | `https://auth-device.gasbuddy.io` |
| `{PackageName}.Key` | API key for authentication | `your-api-key-here` |

For example, if your package is named `AuthDeviceServClient`:

```xml
<appSettings>
  <add key="AuthDeviceServClient.Host" value="https://auth-device.gasbuddy.io" />
  <add key="AuthDeviceServClient.Key" value="your-api-key-here" />
</appSettings>
```

## Usage

### Generate Client with Custom Templates

```bash
docker run --rm \
  -v "$(pwd):/local" \
  openapitools/openapi-generator-cli generate \
  -i /local/api/my-api-spec.yaml \
  -g csharp \
  -o /local/output/my-api-client \
  -t /local/openapi-templates/csharp-gasbuddy \
  --additional-properties=packageName=MyApiClient,targetFramework=net48,library=generichost
```

### Key Parameters

| Parameter | Description |
|-----------|-------------|
| `-t /local/openapi-templates/csharp-gasbuddy` | Path to custom templates |
| `--additional-properties=library=generichost` | Use the generichost library (required for these templates) |

## Project Configuration

After generating, ensure your `.csproj` includes the System.Configuration reference:

```xml
<ItemGroup>
  <Reference Include="System.Configuration" />
</ItemGroup>
```

## Template Modifications

### ClientUtils.mustache

Modified to add:

1. `using System.Configuration;` import
2. `CONFIG_KEY_PREFIX` constant set to package name
3. `BASE_ADDRESS` changed from constant to property that reads from ConfigurationManager
4. `ApiKey` property that reads from ConfigurationManager
5. `DEFAULT_BASE_ADDRESS` constant as fallback

## Updating Templates

If you need to update these templates for a newer version of OpenAPI Generator:

1. Extract the latest templates:
   ```bash
   docker run --rm -v "$(pwd):/local" openapitools/openapi-generator-cli \
     author template -g csharp -o /local/templates-latest
   ```

2. Compare with our customizations:
   ```bash
   diff templates-latest/libraries/generichost/ClientUtils.mustache \
        openapi-templates/csharp-gasbuddy/libraries/generichost/ClientUtils.mustache
   ```

3. Merge any upstream changes while preserving our customizations
