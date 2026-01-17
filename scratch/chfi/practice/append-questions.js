const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];
const newQuestions = JSON.parse(process.argv[3]);

// Read existing file
const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Append new questions
const combined = [...existing, ...newQuestions];

// Write back
fs.writeFileSync(filePath, JSON.stringify(combined, null, 2));

console.log(`Successfully appended ${newQuestions.length} questions. Total: ${combined.length}`);
