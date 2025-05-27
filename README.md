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

## Make sure you have nuget and msbuild.exe

* Try the command `nuget help`. If the command is not found, then you need to download nuget-cli from https://dist.nuget.org/index.html (Use the Windows Command line version). Put the installed nuget.exe file into your desired folder and add that folder to your PATH

* Also add the MSBuild bin folder to your path, e.g. `C:\Program Files (x86)\MSBuild\14.0\Bin`


## API Client With `nuget` Package

If you want to generate a client to be available on nuget(which you probably do), or update an existing client nuget package, then run the following:

```
npm run generate-client [api-repo-name] [api-key]
```

The api-key is the nuget api-key found on app-veyour. It is available in 1Password under the entry `AppVeyour Nuget ApiKey`
Once the process has finished running the client will be avaialble as a nuget package. After installing it you will be required to add the following app.config setting to your consumer project for the client to work.

```
<add key="[nuget-package-name-in-pascal-case].Host" value="[service-url]" />
<add key="[nuget-package-name-in-pascal-case].Key" value="[service-auth-key]" />
```

## API Client Without `nuget` Package

If you just want to generate the code for a client in a local folder then run the following instead:
```
npm run generate-client:folder [api-repo-name]
```

Note that the first time you run `generate-client` it will take several minutes to run as it needs to clone and build `swagger-codegen`.

## Using Docker
If you don't want to install java or maven, you can use Docker:

1. First, build the Docker image:
```bash
docker build -t gasbuddy:swagger-csharp-client -f docker/Dockerfile.dev docker
```

2. For Apple Silicon (M1/M2) Macs, use:
```bash
docker build -t gasbuddy:swagger-csharp-client -f docker/Dockerfile.dev docker --platform linux/amd64
```

3. Run the container interactively:
```bash
docker run -it --rm -v $(pwd):/data gasbuddy:swagger-csharp-client
```

4. Once you are in the container, run:
```bash
npm install
```

## Generating code from a swagger spec
In order to generate the code from a swagger spec, you can `npm run generate-from-spec arg1 arg2 arg3`. Where 
* arg1 is the path to the Swagger Doc
* arg2 is the output directory and the nuget package id
* arg3 is the name of the package
Example:
```
npm run generate-from-spec identity-serv-spec.json identity-serv-client IdentityServClient
```

## Example steps: Updating PoiApiClient
1. Open two command prompts. cd into swagger-csharp-client in both
2. Window 1: clone poi-api repo, cd into it, and `git checkout c-sharp-client`
3. Window 1 again: `git checkout -b c-sharp-client-rpm-v2.0.0`
4. Find the spec file that you want to generate from. This might come from an npm install, or if you have it locally just put it in the swagger-csharp-client project folder for now (e.g. poi-api-spec.json)
5. Window 2 [ON Apple Platform]: `docker build -t gasbuddy:swagger-csharp-client -f docker/Dockerfile.dev docker --platform linux/amd64`. This puts you in the container
6. Window 2 (in container): `yarn run generate-from-spec poi-api-spec.json poi-api PoiApiClient`
7. Window 1: Verify that the generation was successful (`git status`)
8. In the nested poi-api folder (Window 1), update the version in appveyor.yml
9. In the case of poi-api, we need to update src/PoiApiClient/PoiApiApiClient.nuspec, changing the id from poi-api to poi-api-client. You may or may not need to do this, depending on the name of the project in appveyor
10. Window 1: Commit and push the changes

## Workflow for updating repo
It's a bit difficult to get git working in the container with ssh. So for the time being here is a workflow.

1. Outside the container, but inside this project run `git clone {repoName}`
2. Inside the container, run `npm run generate-from-spec {path_to_swagger_doc} {directory_of_repo} {package_name}`
3. Outside the container, add the files, do a PR or a force push or whatever you like.

## Appveyor integration
This repo will create an Appveyor.yml file that will get appveyor to build from the c-sharp-client branch.  You will need to add your project to Appveyor an initially set it to look at the c-sharp-client branch.
