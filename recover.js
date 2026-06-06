const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\Thanya\\.gemini\\antigravity-ide\\brain\\ce87db17-85bc-4525-83cc-8df25bfacf35\\.system_generated\\logs\\transcript.jsonl';
const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const obj = JSON.parse(line);
    if (obj.tool_calls) {
      for (const tc of obj.tool_calls) {
        if (tc.name === 'write_to_file' && tc.args && tc.args.TargetFile && tc.args.TargetFile.includes('SystemStatusDashboard.tsx')) {
          console.log('FOUND SystemStatusDashboard.tsx write in step ' + obj.step_index);
          fs.writeFileSync('c:\\laragon\\www\\saroophai\\components\\SystemStatusDashboard_recovered.tsx', tc.args.CodeContent, 'utf8');
        }
      }
    }
  } catch (e) {
    // Ignore parse errors on bad lines
  }
}
console.log('Done recovery check.');
