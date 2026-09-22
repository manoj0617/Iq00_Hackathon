import { spawn } from 'node:child_process'

const node = process.execPath
const server = spawn(node, ['node_modules/vite/bin/vite.js', '--strictPort'], {
  stdio: ['ignore', 'pipe', 'inherit'],
})

let serverOutput = ''
server.stdout.on('data', (chunk) => {
  serverOutput += chunk.toString()
})

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Vite exited before it became ready.\n${serverOutput}`)
    }
    try {
      const response = await fetch('http://127.0.0.1:4173')
      if (response.ok) return
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`Timed out waiting for Vite.\n${serverOutput}`)
}

let exitCode = 1
try {
  await waitForServer()
  exitCode = await new Promise((resolve, reject) => {
    const runner = spawn(node, ['node_modules/@playwright/test/cli.js', 'test'], {
      stdio: 'inherit',
      env: { ...process.env, PLAYWRIGHT_EXTERNAL_SERVER: '1' },
    })
    runner.once('error', reject)
    runner.once('exit', (code) => resolve(code ?? 1))
  })
} finally {
  server.kill()
}

process.exitCode = exitCode
