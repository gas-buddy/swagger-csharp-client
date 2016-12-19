# swagger-csharp-client
A tool that generates a c# client from the Swagger specification found in a GB api or service repo.

There are two main reasons why we need this tool.

1. GB api and service Swagger specifications are broken down into multiple files.  Existing tools for generating clients from Swagger specifications require a single file.  We deal with this by using [swagger-ref-resolver](https://github.com/gas-buddy/swagger-ref-resolver) to collate the specification prior to generating the client.

2. We have chosen [swagger-codegen](https://github.com/gas-buddy/swagger-codegen) as the c# client generator.  This tool is great, but unfortunately it makes some assumptions that don't work for us.  For example, the api host is read from the Swagger specification and then "baked" into the generated client code, which means we would need to regenerate the client for different environments.  For this reason we have forked `swagger-codegen` to use the api host (and other environment-specific settings) that are specified in the .net configuration file for the client.

# TODO: describe how to setup and use this tool
