# swagger-csharp-client
A tool that generates a c# client from the Swagger specification found in a GB api or service repo.

There are two main reasons why we need this tool.

1. GasBuddy api and service Swagger specifications are broken down into multiple files (e.g. see [poi-api](https://github.com/gas-buddy/poi-api/tree/master/api)).  Existing tools for generating clients from Swagger specifications require a single file.  We deal with this by using [swagger-ref-resolver](https://github.com/gas-buddy/swagger-ref-resolver) to collate the Swagger specification prior to generating the client.

2. We have chosen [swagger-codegen](https://github.com/swagger-api/swagger-codegen) as the c# client generator.  This tool is great, but we need to use a custom `swagger-codegen` template.  We need a custom template since, for example, the default template uses the api host defined in the Swagger specification and then "baked" into the generated client code, which means we would need to regenerate the client for different environments.  For this reason we have created a custom `swagger-codegen` template, which is included in this repo, that causes the generated client to use the api host (and other environment-specific settings) that is defined the .NET configuration file for the generated client.

# Setup and use this swagger-csharp-client

##Requirements

This tool requires maven(http://maven.apache.org/) to be installed on your computer before using it.

## Clone the repository

```
git clone git@github.com:gas-buddy/swagger-csharp-client.git
cd swagger-csharp-client
npm install
```

## Create client repository

If you want to generate a client repository on git or update an existing client repository then follow these steps:
1. Create a new repository for the client if it doesnt already existing
  Go to github and add a new repo should be name [ApiRepoName]-client-csharp
  Make sure it is created with a README as this will create a master branch
2. Run the following command to generate a client

```
npm run generate-client [ApiRepoName] [ClientRepoName]
```

If you just want to generate the code for a client locally then run the following instead:
```
npm run generate-client-local [ApiRepoName] [ClientName]
```

The first time you run the generate-client command in either case it will take several minutes to run as it needs to clone and build swagger-codegen.
