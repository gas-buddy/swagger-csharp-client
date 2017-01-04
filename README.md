# swagger-csharp-client

A tool that generates a c# client from the Swagger specification found in a GB api or service repo.

## Why Do We Need This?

1. GasBuddy api and service Swagger specifications are broken down into multiple files (e.g. see [poi-api](https://github.com/gas-buddy/poi-api/tree/master/api)).  Existing tools for generating clients from Swagger specifications require a single file.  We deal with this by using [swagger-ref-resolver](https://github.com/gas-buddy/swagger-ref-resolver) to collate the Swagger specification prior to generating the client.

2. We have chosen [swagger-codegen](https://github.com/swagger-api/swagger-codegen) as the c# client generator.  This tool is great, but we need to use a custom `swagger-codegen` template for the following reasons:

    * The default c# template "bakes" the api host into the generated client code, but we want the api host to be specified in the client's
    configuration file.
    * We've changed the c# template to include the authorization token in the client's configuration file.
    * There is bug in the default c# template that generates compiler errors in some cases when generating enumerations.

# Setup

## Prerequisites

This tool requires `maven`, which can be downloaded here: http://maven.apache.org/download.cgi

1. Download the binary installation file
2. Extract the binary file to the folder you want to run maven from
3. Add the `bin` directory of the created directory apache-maven-3.3.9 to the `PATH` environment variable
4. Run the following to check for `JAVE_HOME` environment variable

```
echo %JAVA_HOME%
```

5. If the previous returns blank you need to create a JAVA_HOME environment variable to `C:\Program Files\Java\jdk1.7.0_51` on windows or `/Library/Java/JavaVirtualMachines/jdk1.8.0_45.jdk/Contents/Home` on Mac OS
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

## API Client With `nuget` Package Without `git` Repo

If you want to generate a client to be available on nuget without creating a git repo (which you probably do), or update an existing client nuget package, then run the following:

```
npm run generate-client:nuget [api-repo-name] [api-key]
```

The api-key is the nuget api-key found on app-veyour. It is available in 1Password under the entry `AppVeyour Nuget ApiKey`

## API Client With `git` Repo

If you want to generate a client with a git repo, or update an existing client repo, then follow these steps:

1. Create a new repo for the client if it doesn't already exist:
  * The new repo must be named `[api-repo-name]-client-csharp` (e.g. `poi-api-client-csharp`)
  * Ensure the repo is created with a `README.md` file, which will ensure there is a `master` branch
  * Under Collaborators add the developers team as Admin (so appveyor can do stuff)

2. Run the following command to generate a client:

```
npm run generate-client:repo [api-repo-name]
```

For example:
```
npm run generate-client:repo poi-api
```

3. Add the api client repo to appveyor (only need to do this for new api client repos):
  * Navigate to the _Projects_ tab and click `NEW PROJECT`
  * Find the api client repo and click `ADD`
  * Run the `NEW BUILD` command

Once the build completes, the api client will be available as a nuget package, which can add to a .NET project using Visual Studio.

## API Client Without `git` Repo or `nuget` Package

If you just want to generate the code for a client in a local folder then run the following instead:
```
npm run generate-client:folder [api-repo-name]
```

Note that the first time you run `generate-client` it will take several minutes to run as it needs to clone and build `swagger-codegen`.
