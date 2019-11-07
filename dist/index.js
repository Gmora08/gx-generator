#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var inquirer = require("inquirer");
var chalk_1 = require("chalk");
var CURRENT_DIR = process.cwd();
var CHOICES = fs.readdirSync(path.join(__dirname, 'templates'));
var QUESTIONS = [
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
inquirer.prompt(QUESTIONS)
    .then(function (answers) {
    var projectChoice = answers['template'].toString();
    var projectName = answers['name'].toString();
    var currentDir = answers['projectPath'].toString();
    var templatePath = path.join(__dirname, 'templates', projectChoice);
    var targetPath = path.join(currentDir, projectName);
    ;
    var options = {
        projectName: projectName,
        templateName: projectChoice,
        templatePath: templatePath,
        targetPath: targetPath
    };
    console.log(options);
    if (!createProject(targetPath)) {
        return;
    }
    createDirectoryContents(templatePath, projectName, currentDir);
});
function createProject(projectPath) {
    if (fs.existsSync(projectPath)) {
        console.log(chalk_1.default.red("Folder " + projectPath + " exists. Delete or use another name."));
        return false;
    }
    fs.mkdirSync(projectPath);
    return true;
}
// list of file/folder that should not be copied
var SKIP_FILES = ['node_modules', '.template.json'];
function createDirectoryContents(templatePath, projectName, projectPath) {
    // read all files/folders (1 level) from template folder
    var filesToCreate = fs.readdirSync(templatePath);
    // loop each file/folder
    filesToCreate.forEach(function (file) {
        var origFilePath = path.join(templatePath, file);
        // get stats about the current file
        var stats = fs.statSync(origFilePath);
        // skip files that should not be copied
        if (SKIP_FILES.indexOf(file) > -1)
            return;
        if (stats.isFile()) {
            // read file content and transform it using template engine
            var contents = fs.readFileSync(origFilePath, 'utf8');
            // write file to destination folder
            var writePath = path.join(projectPath, projectName, file);
            fs.writeFileSync(writePath, contents, 'utf8');
        }
        else if (stats.isDirectory()) {
            // create folder in destination folder
            fs.mkdirSync(path.join(projectPath, projectName, file));
            // copy files/folder inside current folder recursively
            createDirectoryContents(path.join(templatePath, file), path.join(projectName, file), projectPath);
        }
    });
}
//# sourceMappingURL=index.js.map