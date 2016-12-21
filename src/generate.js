import childProcess from 'child_process';
import fs from 'fs';
import mustache from 'mustache';

const repoNameArg = process.argv[2];
const outputDirectoryArg = process.argv[3];

// Clones and builds the codegen repo so it can be used locally
function cloneCodegen() {
  if (!fs.existsSync('./../swagger-codegen')) {
    // eslint-disable-next-line no-console
    console.log('Building codegen...');
    childProcess.execSync('sh ./src/cloneCodegen.sh');
  }
}

// Create script to clone repo api spec
function cloneRepoApi(repoName) {
  let script = fs.readFileSync('./src/templates/gitClone.sh.mustache', 'utf-8');

  const repoDirectory = `./temp/repo/${repoName}`;
  script = mustache.render(script, { repoName, repoDirectory });

  const scriptFolder = './temp';
  if (!fs.existsSync(scriptFolder)) {
    fs.mkdirSync(scriptFolder);
  }

  const scriptPath = `${scriptFolder}/gitClone.sh`;
  fs.writeFileSync(scriptPath, script);
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

// Generate the client code for the swagger doc
function generateClient(repoName, swaggerFilePath, outputDirectory) {
  let packageName = skewerCaseStringToPascalCaseString(repoName);
  packageName = packageName.replace('Api', 'Client');

  // eslint-disable-next-line no-console
  console.log(`Generating ${packageName}...`);
  childProcess.execSync(`java -jar ./../swagger-codegen/modules/swagger-codegen-cli/target/swagger-codegen-cli.jar generate   -i ${swaggerFilePath}   -l csharp   -o ${outputDirectory}/${packageName} --additional-properties packageName=${packageName} -t ./src/templates`);

  let appConfig = fs.readFileSync('./src/templates/app_test.config.mustache', 'utf-8');
  appConfig = mustache.render(appConfig, { packageName });
  fs.writeFileSync(`${outputDirectory}/${packageName}/src/${packageName}.Test/app.config`, appConfig);
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
function generate(repoName, outputDirectory) {
  if (repoName && outputDirectory) {
    cloneCodegen();
    const repoDirectory = cloneRepoApi(repoName);
    const swaggerFilePath = collateSwagger(repoName, repoDirectory);
    generateClient(repoName, swaggerFilePath, outputDirectory);
    deleteFolderRecursive('./temp');
  } else {
    // eslint-disable-next-line no-console
    console.log('You must specify a repository name and an output directory');
  }
}

generate(repoNameArg, outputDirectoryArg);
