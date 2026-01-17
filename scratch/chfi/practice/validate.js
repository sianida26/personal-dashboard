const data = require('./module1-computer-forensics-in-todays-world.json');
console.log('Valid JSON: YES');
console.log('Total questions:', data.length);
let valid = true;
data.forEach((q, i) => {
    if (!q.question || !q.options || q.options.length !== 4) {
        console.log('Invalid at index', i);
        valid = false;
    }
    const correctCount = q.options.filter(o => o.isCorrect).length;
    if (correctCount !== 1) {
        console.log('Wrong correct count at index', i);
        valid = false;
    }
});
console.log('All questions valid:', valid);
console.log('\n=== Sample Questions ===');
[0, 25, 50, 69].forEach(i => {
    console.log(`Q${i + 1}: ${data[i].question.substring(0, 80)}...`);
});
