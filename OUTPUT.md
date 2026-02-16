Chrome Headless Shell 145.0.7632.6 (playwright chromium-headless-shell v1208) downloaded to /home/runner/.cache/ms-playwright/chromium_headless_shell-1208
0s
Run mkdir -p ./DATA
  
1s
Run npx tsx src/index.ts all
  
node:internal/modules/run_main:123
    triggerUncaughtException(
    ^
Error [TransformError]: Transform failed with 1 error:
/home/runner/work/hackfluency.com/hackfluency.com/scripts/cti/src/llm/query-generator.ts:283:7: ERROR: Unexpected "defa"
    at failureErrorWithLog (/home/runner/work/hackfluency.com/hackfluency.com/scripts/cti/node_modules/esbuild/lib/main.js:1467:15)
    at /home/runner/work/hackfluency.com/hackfluency.com/scripts/cti/node_modules/esbuild/lib/main.js:736:50
    at responseCallbacks.<computed> (/home/runner/work/hackfluency.com/hackfluency.com/scripts/cti/node_modules/esbuild/lib/main.js:603:9)
    at handleIncomingPacket (/home/runner/work/hackfluency.com/hackfluency.com/scripts/cti/node_modules/esbuild/lib/main.js:658:12)
    at Socket.readFromStdout (/home/runner/work/hackfluency.com/hackfluency.com/scripts/cti/node_modules/esbuild/lib/main.js:581:7)
    at Socket.emit (node:events:524:28)
    at addChunk (node:internal/streams/readable:561:12)
    at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
    at Readable.push (node:internal/streams/readable:392:5)
    at Pipe.onStreamRead (node:internal/stream_base_commons:191:23)
Node.js v20.20.0
Error: Process completed with exit code 1.
0s
0s
0s
0s
0s
0s
0s
Post job cleanup.
/usr/bin/git version
git version 2.52.0
Temporarily overriding HOME='/home/runner/work/_temp/83916128-11de-4b64-9dde-1abae3df2983' before making global git config changes
Adding repository directory to the temporary git global config as a safe directory
/usr/bin/git config --global --add safe.directory /home/runner/work/hackfluency.com/hackfluency.com
/usr/bin/git config --local --name-only --get-regexp core\.sshCommand
/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'core\.sshCommand' && git config --local --unset-all 'core.sshCommand' || :"
/usr/bin/git config --local --name-only --get-regexp http\.https\:\/\/github\.com\/\.extraheader
http.https://github.com/.extraheader
/usr/bin/git config --local --unset-all http.https://github.com/.extraheader
/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'http\.https\:\/\/github\.com\/\.extraheader' && git config --local --unset-all 'http.https://github.com/.extraheader' || :"
/usr/bin/git config --local --name-only --get-regexp ^includeIf\.gitdir:
/usr/bin/git submodule foreach --recursive git config --local --show-origin --name-only --get-regexp remote.origin.url