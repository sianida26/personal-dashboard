#!/usr/bin/env bun

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface Subtopic {
  topic: string;
  subtopics: string[];
}

interface Module {
  module_number: number;
  module_name: string;
  topics: Subtopic[];
}

function transformToMarkdown(modules: Module[]): string {
  let markdown = '# CHFI Course Outline\n\n';
  
  for (const module of modules) {
    // Module header
    markdown += `## Module ${module.module_number}: ${module.module_name}\n\n`;
    
    // Topics
    for (const topic of module.topics) {
      markdown += `### ${topic.topic}\n`;
      
      // Subtopics (if any)
      if (topic.subtopics && topic.subtopics.length > 0) {
        for (const subtopic of topic.subtopics) {
          markdown += `- ${subtopic}\n`;
        }
      }
      markdown += '\n';
    }
  }
  
  return markdown;
}

function main() {
  const inputFile = join(__dirname, 'ecourseware-outline.json');
  const outputFile = join(__dirname, 'ecourseware-outline.md');
  
  console.log('Reading JSON file...');
  const jsonContent = readFileSync(inputFile, 'utf-8');
  const modules: Module[] = JSON.parse(jsonContent);
  
  console.log('Transforming to markdown...');
  const markdownContent = transformToMarkdown(modules);
  
  console.log('Writing markdown file...');
  writeFileSync(outputFile, markdownContent);
  
  console.log(`✅ Successfully transformed ${modules.length} modules to markdown`);
  console.log(`📄 Output file: ${outputFile}`);
}

main();
