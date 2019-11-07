#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as inquirer from 'inquirer';
import * as template from './utils/template';
import chalk from 'chalk';

const CURRENT_DIR = process.cwd();
const CHOICES = fs.readdirSync(path.join(__dirname, 'templates'));
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
    name: 'projectPath',
    type: 'input',
    message: 'Project path',
    default: CURRENT_DIR
  }
];

export interface CliOptions {
  projectName: string
  templateName: string
  templatePath: string
  targetPath: string
}

inquirer.prompt(QUESTIONS)
  .then(answers => {
    const projectChoice: string = answers['template'].toString();
    const projectName: string = answers['name'].toString();
    const currentDir: string = answers['projectPath'].toString();
    const templatePath = path.join(__dirname, 'templates', projectChoice);
    const targetPath = path.join(currentDir, projectName);;
    const options: CliOptions = {
      projectName,
      templateName: projectChoice,
      templatePath,
      targetPath
    }
    console.log(options);

    if (!createProject(targetPath)) {
      return;
    }
    createDirectoryContents(templatePath, projectName, currentDir);
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
function createDirectoryContents(templatePath: string, projectName: string, projectPath: string) {
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
      contents = template.render(contents, { projectName });
      // write file to destination folder
      const writePath = path.join(projectPath, projectName, file);
      fs.writeFileSync(writePath, contents, 'utf8');
    } else if (stats.isDirectory()) {
      // create folder in destination folder
      fs.mkdirSync(path.join(projectPath, projectName, file));
      // copy files/folder inside current folder recursively
      createDirectoryContents(path.join(templatePath, file), path.join(projectName, file), projectPath);
    }
  });
}

