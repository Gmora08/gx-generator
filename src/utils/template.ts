import * as ejs from 'ejs';

export interface TemplateData {
  projectAuthor: string
  projectName: string
  projectDescription: string
  projectVersion: string
  projectRepository: string
}

export function render(content: string, data: TemplateData) {
  return ejs.render(content, data);
}
