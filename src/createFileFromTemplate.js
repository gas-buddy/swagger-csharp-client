import fs from 'fs';
import mustache from 'mustache';

// Creates a file from a template
export function createFileFromTemplate(templatePath, outputPath, viewModel) {
  let file = fs.readFileSync(templatePath, 'utf-8');
  file = mustache.render(file, viewModel);
  fs.writeFileSync(outputPath, file);
}
