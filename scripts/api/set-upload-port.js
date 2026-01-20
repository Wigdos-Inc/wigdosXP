#!/usr/bin/env node

/**
 * Helper script to generate JavaScript code for setting upload server port
 * Run this after starting servers to get the command to run in browser console
 */

const port = process.env.UPLOAD_SERVER_PORT || '3001';

console.log('\n📝 To configure WigTube to use the upload server:');
console.log('\n1. Open WigTube in your browser');
console.log('2. Open browser console (F12)');
console.log('3. Run this command:');
console.log('\x1b[36m%s\x1b[0m', `localStorage.setItem('wigtubeUploadPort', '${port}');`);
console.log('\n4. Refresh the page');
console.log(`\n✅ WigTube will now use port ${port} for uploads\n`);
