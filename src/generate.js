import childProcess from 'child_process';
import fs from 'fs';
import mustache from 'mustache';
import jsyaml from 'js-yaml';

// Creates a file from a template
function createFileFromTemplate(templatePath, outputPath, viewModel) {
  let file = fs.readFileSync(templatePath, 'utf-8');
  file = mustache.render(file, viewModel);
  fs.writeFileSync(outputPath, file);
}

// Clones and builds the codegen repo so it can be used locally
function cloneCodegen() {
  if (!fs.existsSync('./../swagger-codegen')) {
    // eslint-disable-next-line no-console
    console.log('Cloning swagger-codegen...');
    childProcess.execSync('sh ./src/cloneCodegen.sh');
  }
  if (!fs.existsSync('./../swagger-codegen/modules/swagger-codegen-cli/target/swagger-codegen-cli.jar')) {
    // eslint-disable-next-line no-console
    console.log('Building swagger-codegen...');
    childProcess.execSync('sh ./src/buildCodegen.sh');
  }
}

// Create script to clone repo api spec
function cloneRepoApi(repoName) {
  const scriptFolder = './temp';
  if (!fs.existsSync(scriptFolder)) {
    fs.mkdirSync(scriptFolder);
  }

  const repoDirectory = `./temp/repo/${repoName}`;
  const scriptPath = `${scriptFolder}/cloneApiSwagger.sh`;
  createFileFromTemplate('./src/templates/cloneApiSwagger.sh.mustache', scriptPath, { repoName, repoDirectory });

  childProcess.execSync(`sh ${scriptPath}`);

  return repoDirectory;
}

// Collate the swagger into a single document
function collateSwagger(repoName, repoDirectory) {
  // eslint-disable-next-line no-console
  console.log('Compiling swagger...');

  const swaggerFolder = './temp/swagger';
  if (!fs.existsSync(swaggerFolder)) {
    fs.mkdirSync(swaggerFolder);
  }

  let exstension = 'json';
  if (!fs.existsSync(`${repoDirectory}/api/${repoName}.${exstension}`)) {
    exstension = 'yaml';
  }

  const swaggerFilePath = `${swaggerFolder}/${repoName}.${exstension}`;

  childProcess.execSync(`swagger-pack ${repoDirectory}/api/${repoName}.${exstension} > ${swaggerFilePath}`);

  return swaggerFilePath;
}

// Convert a skerer case string to a pascal case string
function skewerCaseStringToPascalCaseString(str) {
  // Convert first letter
  let returnString = str;
  if (str.length > 0) {
    returnString = str[0].toUpperCase() + str.substring(1);
  }
  // look for an ascii character that's preceded by an underscore
  return returnString.replace(/-(\w)/g, (wholeMatch, letterOnly) => {
    let result = '';
    if (letterOnly === '-') {
      result = wholeMatch;
    } else {
      result = letterOnly.toUpperCase();
    }
    return result;
  });
}

// Clones the client repo
function cloneClient(repoName, repoDirectory) {
  // eslint-disable-next-line no-console
  console.log(`Cloning ${repoName}...`);

  const scriptPath = './temp/cloneClient.sh';
  createFileFromTemplate('./src/templates/cloneClient.sh.mustache', scriptPath, { repoName, repoDirectory });

  childProcess.execSync(`sh ${scriptPath}`);
}

// Pulls the client repo to ensure it is up to date
function pullClient(repoName, repoDirectory) {
  // eslint-disable-next-line no-console
  console.log(`Pulling master from ${repoName}...`);

  const scriptPath = './temp/pullClient.sh';
  createFileFromTemplate('./src/templates/pullClient.sh.mustache', scriptPath, { repoDirectory });

  childProcess.execSync(`sh ${scriptPath}`);
}

// Returns the commit Id of the api
function getApiCommitId(apiDirectory) {
  let script = fs.readFileSync('./src/templates/getCommitId.sh.mustache', 'utf-8');
  script = mustache.render(script, { repoDirectory: apiDirectory });
  const scriptPath = './temp/getCommitId.sh';
  fs.writeFileSync(scriptPath, script);
  const commitId = childProcess.execSync(`sh ${scriptPath}`);
  return commitId;
}

// Checkouts a new branch of the client repo
function checkoutClient(clientRepoName, clientRepoDirectory) {
  if (!fs.existsSync(clientRepoDirectory)) {
    cloneClient(clientRepoName, clientRepoDirectory);
  } else {
    pullClient(clientRepoName, clientRepoDirectory);
  }
}

// Returns the swagger version from a filepath
function getSwaggerVersion(swaggerFilePath) {
  let file = fs.readFileSync(swaggerFilePath, 'utf-8');
  if (swaggerFilePath.includes('.yaml')) {
    file = jsyaml.load(file);
  } else {
    file = JSON.parse(file);
  }

  // This is needed because it will drop the .0 in the version at the end
  let version = file.info.version;
  if (version.split('.').length < 3) {
    version = `${version}.0`;
  }

  return version;
}

// Commits the branch and pushes it to the remote
function commitClient(apiName, clientDirectory, commitId, apiVersion) {
  const comment = `Client for v${apiVersion} https://github.com/gas-buddy/${apiName}/tree/${commitId}`;

  let script = fs.readFileSync('./src/templates/commitClient.sh.mustache', 'utf-8');
  script = mustache.render(script, { repoDirectory: clientDirectory, comment });
  const scriptPath = './temp/commitClient.sh';
  fs.writeFileSync(scriptPath, script);

  childProcess.execSync(`sh ${scriptPath}`);
}

// Sets up the appveyor configuration
function setupAppVeyor(packageName, outputDirectory, clientRepoName, apiVersion) {
  createFileFromTemplate('./src/templates/appveyor.yml.mustache', `${outputDirectory}/appveyor.yml`, { packageName, apiVersion });
}

// Pushes the cleitn to nuget
function pushToNuget(clientDirectory, projectName, apiVersion, nugetPackageName, nugetApiKey) {
  const scriptPath = './temp/nugetPush.sh';
  createFileFromTemplate('./src/templates/nugetPush.sh.mustache', scriptPath, { projectName, apiVersion, clientDirectory, nugetPackageName, nugetApiKey });
  childProcess.execSync(`sh ${scriptPath}`);
}

// Generate the client code for the swagger doc
function generateClient(settings) {
  let commitId = getApiCommitId(settings.repoDirectory);
  commitId = commitId.toString().substring(0, 8);

  const outputDirectory = `./../${settings.clientRepoName}`;

  if (settings.mode === 'repo') {
    checkoutClient(settings.clientRepoName, outputDirectory);
  }

  let packageName = skewerCaseStringToPascalCaseString(settings.repoName);
  packageName = `${packageName}Client`;

  // eslint-disable-next-line no-console
  console.log(`Generating ${packageName}...`);
  childProcess.execSync(`java -jar ./../swagger-codegen/modules/swagger-codegen-cli/target/swagger-codegen-cli.jar generate   -i ${settings.swaggerFilePath}   -l csharp   -o ${outputDirectory} --additional-properties packageName=${packageName} -t ./src/templates`);

  createFileFromTemplate('./src/templates/app_test.config.mustache', `${outputDirectory}/src/${packageName}.Test/app.config`, { packageName });

  if (settings.mode !== 'folder') {
    const apiVersion = getSwaggerVersion(settings.swaggerFilePath);
    createFileFromTemplate('./src/templates/nuget.nuspec.mustache', `${outputDirectory}/src/${packageName}/${packageName}.nuspec`, { packageName, repoName: settings.clientRepoName });

    if (settings.mode === 'repo') {
      setupAppVeyor(packageName, outputDirectory, settings.clientRepoName, apiVersion);
      // eslint-disable-next-line no-console
      console.log(`Pushing commit to https://github.com/gas-buddy/${settings.clientRepoName} ...`);
      commitClient(settings.repoName, outputDirectory, commitId, apiVersion);
    } else if (settings.mode === 'nuget') {
      // eslint-disable-next-line no-console
      console.log(`Pushing nuget package: ${settings.clientRepoName}, version: ${apiVersion}`);
      pushToNuget(outputDirectory, packageName, apiVersion, settings.clientRepoName, settings.nugetApiKey);
    }
  }
}

// Deletes a folder and all of it's contents
function deleteFolderRecursive(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach((file) => {
      const curPath = `${path}/${file}`;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}

function showUsage() {
  // eslint-disable-next-line no-console
  console.log('Usage: generate-client:[nuget|repo|folder] [api-repo-name] [api-key:only when using nuget option]');
}

// Generates a csharp client from a repo
function generate(repoName, mode, nugetApiKey) {
  if (repoName) {
    let clientRepoName = `${repoName}-client`;
    if (mode !== 'nuget') {
      clientRepoName = `${clientRepoName}-csharp`;
    }

    cloneCodegen();
    const repoDirectory = cloneRepoApi(repoName);
    const swaggerFilePath = collateSwagger(repoName, repoDirectory);
    const settings = { repoName, repoDirectory, swaggerFilePath, clientRepoName, mode, nugetApiKey };
    generateClient(settings);
    deleteFolderRecursive('./temp');

    // eslint-disable-next-line no-console
    console.log(`Succesffully updated ${clientRepoName}`);
  } else {
    showUsage();
  }
}

// Are the command line args valid?
function validCommandLineArgs() {
  if (process.argv.length !== 4 || (process.argv[2] !== 'folder' && process.argv[2] !== 'repo')) {
    if (process.argv.length !== 5 || process.argv[2] !== 'nuget') {
      return false;
    }
  }
  return true;
}

// Generate an api client from the command line args
function generateFromCommandLineArgs() {
  if (validCommandLineArgs()) {
    const mode = process.argv[2];
    const repoNameArg = process.argv[3];
    const apiKeyArg = process.argv[4];
    generate(repoNameArg, mode, apiKeyArg);
  } else {
    showUsage();
  }
}

generateFromCommandLineArgs();
