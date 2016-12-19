import sys from 'sys';
import process from 'child_process';

const exec = process.exec;
function puts(error, stdout, stderr) { sys.puts(stdout) }


async function generate(repoName){
  exec("ls -la", puts);
}

create().then(async (app) => {
  try {
    const repoName = args[2];
    await generate(repoName);
  } catch (err) {
    app.Logger.error(err);
  } finally {
    destroy();
  }
});
