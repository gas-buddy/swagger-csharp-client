# swagger-csharp-client
A tool that generates a c# client from the Swagger specification found in a GB api or service repo.

There are two main reasons why we need this tool.

1. GasBuddy api and service Swagger specifications are broken down into multiple files (e.g. see [poi-api](https://github.com/gas-buddy/poi-api/tree/master/api)).  Existing tools for generating clients from Swagger specifications require a single file.  We deal with this by using [swagger-ref-resolver](https://github.com/gas-buddy/swagger-ref-resolver) to collate the Swagger specification prior to generating the client.

2. We have chosen [swagger-codegen](https://github.com/swagger-api/swagger-codegen) as the c# client generator.  This tool is great, but we need to use a custom `swagger-codegen` template.  We need a custom template since, for example, the default template uses the api host defined in the Swagger specification and then "baked" into the generated client code, which means we would need to regenerate the client for different environments.  For this reason we have created a custom `swagger-codegen` template, which is included in this repo, that causes the generated client to use the api host (and other environment-specific settings) that is defined the .NET configuration file for the generated client.

# Setup

## Requirements

This tool requires `maven`, which can be downloaded here: http://maven.apache.org/

## Clone and Install

```
git clone git@github.com:gas-buddy/swagger-csharp-client.git
cd swagger-csharp-client
npm install
```

# Generating an API Client

## API Client With git Repo

If you want to generate a client with a git repo, or update an existing client repo, then follow these steps:
1. Create a new repo for the client if it doesn't already exist:
  * The new repo should be named `[api-repo-name]-client-csharp` (e.g. `poi-api-client-csharp`)
  * Ensure the repo is created with a `README.md` file, which will ensure there is a `master` branch
2. Run the following command to generate a client:

```
npm run generate-client:repo [api-repo-name] [client-repo-name]
```

For example:
```
npm run generate-client:repo poi-api poi-api-client-csharp
```

## API Client Without git Repo

If you just want to generate the code for a client in a local folder then run the following instead:
```
npm run generate-client:folder [api-repo-name] -f [client-name]
```

The first time you run `generate-client` it will take several minutes to run as it needs to clone and build `swagger-codegen`.
