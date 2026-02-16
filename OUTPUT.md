Run mkdir -p ./DATA
  
0s
Run npx tsx src/index.ts all
  
node:internal/modules/run_main:123
    triggerUncaughtException(
    ^
Error [TransformError]: Transform failed with 1 error:
/home/runner/work/hackfluency.com/hackfluency.com/scripts/cti/src/llm/orchestrator.ts:660:20: ERROR: Expected ";" but found "You"
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