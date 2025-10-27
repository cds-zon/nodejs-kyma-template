/**
 * Run all tests
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runTest(testFile: string): Promise<boolean> {
  return new Promise((resolve) => {
    const testPath = join(__dirname, testFile);
    const child = spawn('tsx', [testPath], {
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

async function runAllTests() {
  console.log('🧪 Running all tests...\n');

  const tests = [
    'dummy.test.ts',
    'mock.test.ts',
    'ias.test.ts',
  ];

  let allPassed = true;

  for (const test of tests) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running: ${test}`);
    console.log('='.repeat(60));

    const passed = await runTest(test);
    if (!passed) {
      allPassed = false;
      console.error(`\n❌ ${test} failed\n`);
    } else {
      console.log(`\n✅ ${test} passed\n`);
    }
  }

  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ All tests passed!');
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
  console.log('='.repeat(60) + '\n');
}

runAllTests().catch(console.error);
