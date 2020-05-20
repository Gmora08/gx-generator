#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as inquirer from 'inquirer';
import * as template from './utils/template';
import * as shell from 'shelljs';
import chalk from 'chalk';

const CURRENT_DIR = process.cwd();
const CHOICES = fs.readdirSync(path.join(__dirname, 'templates'));
const DB_CHOICES = ['Postgresql', 'Sqlserver', 'None'];
const QUESTIONS = [
  {
    name: 'template',
    type: 'list',
    message: 'What project template would you like to generate?',
    choices: CHOICES
  },
  {
    name: 'name',
    type: 'input',
    message: 'Project name: '
  },
  {
    name: 'projectDescription',
    type: 'input',
    message: 'Project description: '
  },
  {
    name: 'projectAuthor',
    type: 'input',
    message: 'Project author: '
  },
  {
    name: 'projectVersion',
    type: 'input',
    message: 'Project version: ',
    default: '1.0.0'
  },
  {
    name: 'portNumber',
    type: 'input',
    message: 'Port Number: ',
    default: '3000'
  },
  {
    name: 'setTypeOrm',
    type: 'list',
    message: 'Add TypeORM',
    choices: DB_CHOICES,
  },
  {
    name: 'shouldInitGitRepo',
    type: 'confirm',
    message: 'Init local git repository?'
  },
  {
    name: 'shouldLinkRemoteRepo',
    type: 'confirm',
    message: 'Add remote git repository?',
    default: 'N'
  },
  {
    name: 'projectRepository',
    type: 'input',
    message: "Project repository link: ",
    when: (answers: object) => answers["shouldLinkRemoteRepo"]
  },
  {
    name: 'projectPath',
    type: 'input',
    message: 'Project path',
    default: CURRENT_DIR
  },
  {
    name: 'setNewRelic',
    type: 'confirm',
    message: 'Add newrelic integration',
    default: 'N'
  },
  {
    name: 'setSentry',
    type: 'confirm',
    message: 'Add Sentry integration',
    default: 'N'
  }
];

export interface CliOptions {
  projectAuthor: string
  projectName: string
  projectDescription: string
  portNumber: string,
  templateName: string
  templatePath: string
  targetPath: string
  projectVersion: string
  projectRepository: string
  shouldInitGitRepo: boolean
  shouldLinkRemoteRepo: boolean,
  setTypeOrm: string,
  setNewRelic: boolean,
  setSentry: boolean, 
}

export interface files {
  projectPath: string,
  appFilePath: string,
  envSampleFilePath: string,
  configFilesTemplate: string
}

inquirer.prompt(QUESTIONS)
  .then(answers => {
    const configFilesTemplate = path.join(__dirname, 'complementary_files');
    const projectAuthor: string = answers['projectAuthor'].toString();
    const projectChoice: string = answers['template'].toString();
    const projectName: string = answers['name'].toString();
    const currentDir: string = answers['projectPath'].toString();
    const projectDescription: string = answers['projectDescription'].toString();
    const portNumber: string = answers['portNumber'].toString();
    const projectVersion: string = answers['projectVersion'].toString();
    const projectRepository: string = answers['projectRepository'];
    const templatePath = path.join(__dirname, 'templates', projectChoice);
    const targetPath = path.join(currentDir, projectName);
    const shouldInitGitRepo: boolean = answers['shouldInitGitRepo'];
    const shouldLinkRemoteRepo: boolean = answers['shouldLinkRemoteRepo'];
    const setTypeOrm: string = answers['setTypeOrm'];
    const setNewRelic: boolean = answers['setNewRelic'];
    const setSentry: boolean = answers['setSentry'];
    const projectPath: string = `${currentDir}/${projectName}`
    const appFilePath: string = path.join(projectPath, 'src/app.js')
    const envSampleFilePath: string = path.join(projectPath, '.env.sample')
    const filesPath: files = {
      projectPath,
      appFilePath,
      envSampleFilePath, 
      configFilesTemplate
    }
    const options: CliOptions = {
      projectAuthor,
      projectName,
      projectDescription,
      portNumber,
      templateName: projectChoice,
      templatePath,
      targetPath,
      projectVersion,
      projectRepository,
      shouldInitGitRepo,
      shouldLinkRemoteRepo,
      setTypeOrm,
      setNewRelic,
      setSentry
    }

    if (!createProject(targetPath)) {
      return;
    }
    createDirectoryContents(templatePath, projectName, options, currentDir);
    postProcess(options);
    setPortNumber(envSampleFilePath, options)
    setTypeORMConfiguration(filesPath, options);
    setupNewRelic(configFilesTemplate, projectPath, options);
    setupSentry(filesPath, options)
    // This instructions should be the last
    initGitRepository(options);
    linkRemoteRepository(options);
  });

function createProject(projectPath: string) {
  if (fs.existsSync(projectPath)) {
    console.log(chalk.red(`Folder ${projectPath} exists. Delete or use another name.`));
    return false;
  }

  fs.mkdirSync(projectPath);
  return true;
}

// list of file/folder that should not be copied
const SKIP_FILES = ['node_modules', '.template.json'];
function createDirectoryContents(templatePath: string, projectName: string, options: CliOptions, projectPath: string) {
  // read all files/folders (1 level) from template folder
  const filesToCreate = fs.readdirSync(templatePath);
  // loop each file/folder
  filesToCreate.forEach(file => {
    const origFilePath = path.join(templatePath, file);

    // get stats about the current file
    const stats = fs.statSync(origFilePath);

    // skip files that should not be copied
    if (SKIP_FILES.indexOf(file) > -1) return;

    if (stats.isFile()) {
      // read file content and transform it using template engine
      let contents = fs.readFileSync(origFilePath, 'utf8');
      contents = template.render(contents, options);
      // write file to destination folder
      const writePath = path.join(projectPath, projectName, file);
      fs.writeFileSync(writePath, contents, 'utf8');
    } else if (stats.isDirectory()) {
      // create folder in destination folder
      fs.mkdirSync(path.join(projectPath, projectName, file));
      // copy files/folder inside current folder recursively
      createDirectoryContents(path.join(templatePath, file), path.join(projectName, file), options, projectPath);
    }
  });
}

function postProcess(options: CliOptions) {
  const isNode = fs.existsSync(path.join(options.templatePath, 'package.json'));

  if (isNode) {
    shell.cd(options.targetPath);
    const result = shell.exec('npm install');
    if (result.code !== 0) {
      return false;
    }
  }

  return true;
}

function setPortNumber(envSampleFilePath: string, options: CliOptions){
  shell.exec(`sed -i \'$a export PORT=${options.portNumber}\' ${envSampleFilePath}`)
  return true;
}

function initGitRepository(options: CliOptions) {
  if (!options.shouldInitGitRepo) { return false; }

  shell.cd(options.targetPath);
  shell.exec('git init .');
  shell.exec('git add .');
  shell.exec('git commit -am "Inital setup"');

  return true;
}

function linkRemoteRepository(options: CliOptions) {
  if (!options.shouldLinkRemoteRepo) { return false; }

  shell.cd(options.targetPath);
  shell.exec(`git remote add origin ${options.projectRepository}`);

  return true;
}

function setupNewRelic(configFilesPath: string, projectPath: string, options: CliOptions) {
  if (!options.setNewRelic) { return false; }
  // install newrelic dependency
  shell.cd(options.targetPath);
  shell.exec('npm install --save newrelic');
  // copy config file
  shell.cp(`${configFilesPath}/newrelic/newrelic.js`, projectPath);

  return true;
}

function setupSentry(filesPath: files, options: CliOptions){
  if (!options.setSentry) { return false; }
  shell.cd(options.targetPath);
  shell.exec('npm install @sentry/node@5.12.2')
  
  shell.exec(`sed -i \'/^const app = express().*/i const Sentry = require("@sentry/node");\\n\' ${filesPath.appFilePath}`)
  shell.exec(`sed -i \'/^const app = express().*/a Sentry.init({ dsn: process.env.SENTRY_DSN });\\napp.use(Sentry.Handlers.requestHandler());\\n\' ${filesPath.appFilePath}`)
  shell.exec(`sed -i \'/^app.use(router);.*/a app.use(Sentry.Handlers.errorHandler());\' ${filesPath.appFilePath} `)
  shell.exec(`sed -i \'$a export SENTRY_DSN=""\' ${filesPath.envSampleFilePath}`)
  return true;
}

function setTypeORMConfiguration(filesPath: files, options: CliOptions) {
  if(options.setTypeOrm === 'None'){ return false; }

  shell.cd(options.targetPath);
  shell.exec('npm install typeorm --save');
  shell.exec('npm install reflect-metadata --save');
  shell.exec('npm install @types/node --save')
  switch (options.setTypeOrm) {
    case 'Postgresql':
      shell.exec('npm install pg --save');
    case 'Sqlserver':
      shell.exec('npm install mssql --save');
  }
  // Add import on app file
  shell.cp(`${filesPath.configFilesTemplate}/typeorm/ormconfig.json`, filesPath.projectPath);
  shell.exec(`sed -i \'2 i\\import "reflect-metadata";\' ${filesPath.appFilePath}`)
  fs.mkdirSync('src/components/entity');
  fs.mkdirSync('src/migrations');
  shell.exec(`sed -i \'$a export SQL_DATABASE=""\\nexport SQL_HOST=""\\nexport SQL_PASS=""\\nexport SQL_PORT=""\\nexport SQL_USER=""\' ${filesPath.envSampleFilePath}`)
 
  return true;
}
