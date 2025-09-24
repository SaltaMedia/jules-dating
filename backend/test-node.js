console.log('Node.js is working!');
console.log('Testing basic functionality...');

setTimeout(() => {
  console.log('Timeout works!');
  process.exit(0);
}, 1000);

console.log('Waiting for timeout...');
