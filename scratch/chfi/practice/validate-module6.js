const data = require('./module6-windows-forensics.json');
console.log('Valid JSON: YES');
console.log('Total questions:', data.length);
let valid = true;
data.forEach((q, i) => {
    if (!q.question || !q.options || q.options.length < 3) {
        console.log('Invalid at index', i, '- missing question or options');
        valid = false;
    }
    const correctCount = q.options.filter(o => o.isCorrect).length;
    if (correctCount < 1) {
        console.log('No correct answer at index', i);
        valid = false;
    }
});
console.log('All questions valid:', valid);
console.log('\n=== Sample Questions ===');
[0, 25, 50, 75, 99].forEach(i => {
    if (data[i]) {
        console.log(`Q${i + 1}: ${data[i].question.substring(0, 80)}...`);
    }
});
