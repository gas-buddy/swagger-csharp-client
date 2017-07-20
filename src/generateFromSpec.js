import childProcess from 'child_process';
import { createFileFromTemplate } from './createFileFromTemplate';

function generateFromSpec() {
  const swaggerPath = process.argv[2];
  const outputDirectory = process.argv[3];
  const packageName = process.argv[4];

  console.log(`Generating ${packageName}...`);
  childProcess.execSync(`java -jar ./../swagger-codegen/modules/swagger-codegen-cli/target/swagger-codegen-cli.jar generate   -i ${swaggerPath}   -l csharp   -o ${outputDirectory} --additional-properties packageName=${packageName} -t ./src/templates`);
  createFileFromTemplate('./src/templates/app_test.config.mustache', `${outputDirectory}/src/${packageName}.Test/app.config`, { packageName });
}

generateFromSpec();
