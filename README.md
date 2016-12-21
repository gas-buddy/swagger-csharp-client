# swagger-csharp-client
A tool that generates a c# client from the Swagger specification found in a GB api or service repo.

There are two main reasons why we need this tool.

1. GasBuddy api and service Swagger specifications are broken down into multiple files (e.g. see [poi-api](https://github.com/gas-buddy/poi-api/tree/master/api)).  Existing tools for generating clients from Swagger specifications require a single file.  We deal with this by using [swagger-ref-resolver](https://github.com/gas-buddy/swagger-ref-resolver) to collate the Swagger specification prior to generating the client.

2. We have chosen [swagger-codegen](https://github.com/swagger-api/swagger-codegen) as the c# client generator.  This tool is great, but we need to use a custom `swagger-codegen` template.  We need a custom template since, for example, the default template uses the api host defined in the Swagger specification and then "baked" into the generated client code, which means we would need to regenerate the client for different environments.  For this reason we have created a custom `swagger-codegen` template, which is included in this repo, that causes the generated client to use the api host (and other environment-specific settings) that is defined the .NET configuration file for the generated client.

# Setup and use this swagger-csharp-client
This tool requires maven(http://maven.apache.org/) to be installed on your computer before using it.

```
git clone git@github.com:gas-buddy/swagger-csharp-client.git
cd swagger-csharp-client
npm install
npm run generate-client REPONAME OUTPUTFOLDER
```
