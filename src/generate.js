import childProcess from 'child_process';
import fs from 'fs';
import mustache from 'mustache';

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
    console.log('Cloning codegen...');
    childProcess.execSync('sh ./src/cloneCodegen.sh');
  }
  if (!fs.existsSync('./../swagger-codegen/modules/swagger-codegen-cli/target/swagger-codegen-cli.jar')) {
    // eslint-disable-next-line no-console
    console.log('Building codegen...');
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
  console.log(`Getting latest on ${repoName}...`);

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
function checkoutClient(clientRepoName, clientRepoDirectory, branchName) {
  if (!fs.existsSync(clientRepoDirectory)) {
    cloneClient(clientRepoName, clientRepoDirectory);
  } else {
    pullClient(clientRepoName, clientRepoDirectory);
  }

  // Removed code to create new branch for now
  // const scriptPath = './temp/createBranch.sh';
  // createFileFromTemplate('./src/templates/createBranch.sh.mustache', scriptPath, { branchName, repoDirectory: clientRepoDirectory });
  // childProcess.execSync(`sh ${scriptPath}`);
}

// Commits the branch and pushes it to the remote
function commitClient(apiName, clientDirectory, commitId) {
  const comment = `Client for: https://github.com/gas-buddy/${apiName}/tree/${commitId}`;

  let script = fs.readFileSync('./src/templates/commitClient.sh.mustache', 'utf-8');
  script = mustache.render(script, { repoDirectory: clientDirectory, comment });
  const scriptPath = './temp/commitClient.sh';
  fs.writeFileSync(scriptPath, script);

  childProcess.execSync(`sh ${scriptPath}`);
}

// Sets up the appveyor configuration
function setupAppVeyor(packageName, outputDirectory, clientRepoName) {
  createFileFromTemplate('./src/templates/appveyor.yml.mustache', `${outputDirectory}/appveyor.yml`, { packageName });
  createFileFromTemplate('./src/templates/nuget.nuspec.mustache', `${outputDirectory}/src/${packageName}/${packageName}.nuspec`, { packageName, repoName: clientRepoName });
}

// Generate the client code for the swagger doc
function generateClient(repoName, repoDirectory, swaggerFilePath, clientRepoName, mode) {
  const commitId = getApiCommitId(repoDirectory);
  const branchName = `auto-generated-commit#${commitId}`;

  const outputDirectory = `./../${clientRepoName}`;

  if (mode === 'repo') {
    checkoutClient(clientRepoName, outputDirectory, branchName);
  }

  let packageName = skewerCaseStringToPascalCaseString(repoName);
  packageName = `${packageName}Client`;

  // eslint-disable-next-line no-console
  console.log(`Generating ${packageName}...`);
  childProcess.execSync(`java -jar ./../swagger-codegen/modules/swagger-codegen-cli/target/swagger-codegen-cli.jar generate   -i ${swaggerFilePath}   -l csharp   -o ${outputDirectory} --additional-properties packageName=${packageName} -t ./src/templates`);

  createFileFromTemplate('./src/templates/app_test.config.mustache', `${outputDirectory}/src/${packageName}.Test/app.config`, { packageName });

  if (mode === 'repo') {
    setupAppVeyor(packageName, outputDirectory, clientRepoName);

    // eslint-disable-next-line no-console
    console.log(`Pushing branch https://github.com/gas-buddy/${clientRepoName}/tree/${branchName}...`);
    commitClient(repoName, outputDirectory, commitId);
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

// Generates a csharp client from a repo
function generate(repoName, clientRepoName, mode) {
  if (repoName && clientRepoName) {
    cloneCodegen();
    const repoDirectory = cloneRepoApi(repoName);
    const swaggerFilePath = collateSwagger(repoName, repoDirectory);
    generateClient(repoName, repoDirectory, swaggerFilePath, clientRepoName, mode);
    deleteFolderRecursive('./temp');

    // eslint-disable-next-line no-console
    console.log(`Succesffully updated ${clientRepoName}`);
  } else {
    // eslint-disable-next-line no-console
    console.log('You must specify an api-repo-name and a client-repo-name/client-folder-name');
  }
}

// Validate the command line args; return true if valid, show usage on console otherwise
function validCommandLineArgs() {
  if (process.argv.length !== 5 || (process.argv[2] !== 'folder' && process.argv[2] !== 'repo')) {
    // eslint-disable-next-line no-console
    console.log('Usage: generate-client:[repo|folder] [api-repo-name] [client-repo-name|client-folder-name]');
    return false;
  }
  return true;
}

// Generate an api client from the command line args
function generateFromCommandLineArgs() {
  if (validCommandLineArgs()) {
    const mode = process.argv[2];
    const repoNameArg = process.argv[3];
    const clientRepoNameArg = process.argv[4];
    generate(repoNameArg, clientRepoNameArg, mode);
  }
}

generateFromCommandLineArgs();
