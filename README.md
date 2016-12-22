# swagger-csharp-client
A tool that generates a c# client from the Swagger specification found in a GB api or service repo.

There are two main reasons why we need this tool.

1. GasBuddy api and service Swagger specifications are broken down into multiple files (e.g. see [poi-api](https://github.com/gas-buddy/poi-api/tree/master/api)).  Existing tools for generating clients from Swagger specifications require a single file.  We deal with this by using [swagger-ref-resolver](https://github.com/gas-buddy/swagger-ref-resolver) to collate the Swagger specification prior to generating the client.

2. We have chosen [swagger-codegen](https://github.com/swagger-api/swagger-codegen) as the c# client generator.  This tool is great, but we need to use a custom `swagger-codegen` template.  We need a custom template since, for example, the default template uses the api host defined in the Swagger specification and then "baked" into the generated client code, which means we would need to regenerate the client for different environments.  For this reason we have created a custom `swagger-codegen` template, which is included in this repo, that causes the generated client to use the api host (and other environment-specific settings) that is defined the .NET configuration file for the generated client.

# Setup

## Requirements

This tool requires `maven`, which can be downloaded here: http://maven.apache.org/download.cgi

To install maven
1. Download the binary installation file
2. Extract the binary file to the folder you want to run maven from
3. Add the bin directory of the created directory apache-maven-3.3.9 to the PATH environment variable
4. Run the following to check for JAVE_HOME environment variable
```
echo %JAVA_HOME%
```
5. If the previous returns blank you need to create a JAVA_HOME environment variable to C:\Program Files\Java\jdk1.7.0_51 on windows or /Library/Java/JavaVirtualMachines/jdk1.8.0_45.jdk/Contents/Home on Mac OS
6. To confirm maven is working run the following in a new shell:

```
mvn -v
```

The result should look similar to

```
Apache Maven 3.3.3 (7994120775791599e205a5524ec3e0dfe41d4a06; 2015-04-22T04:57:37-07:00)
Maven home: /opt/apache-maven-3.3.3
Java version: 1.8.0_45, vendor: Oracle Corporation
Java home: /Library/Java/JavaVirtualMachines/jdk1.8.0_45.jdk/Contents/Home/jre
Default locale: en_US, platform encoding: UTF-8
OS name: "mac os x", version: "10.8.5", arch: "x86_64", family: "mac"
```

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
  * Under Collaborators add the developers team as admin
2. Run the following command to generate a client:

```
npm run generate-client:repo [api-repo-name] [client-repo-name]
```

For example:
```
npm run generate-client:repo poi-api poi-api-client-csharp
```

3. Add to appveyor to access as nuget package
  * First you will need to navigate to the projects tab and click NEW PROJECT
  * Add your new client project
  * Run the NEW BUILD command

Your project should now be available as a nuget package

## API Client Without git Repo

If you just want to generate the code for a client in a local folder then run the following instead:
```
npm run generate-client:folder [api-repo-name] [client-name]
```

The first time you run `generate-client` it will take several minutes to run as it needs to clone and build `swagger-codegen`.
