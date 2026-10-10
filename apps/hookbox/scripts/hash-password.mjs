import { hash } from 'bcryptjs'
import { stdin, stderr, stdout, argv, exit } from 'node:process'

if (argv.length > 2) {
  stderr.write(
    "Refusing to read a password from arguments so it stays out of shell history.\nPipe it instead: printf '%s' 'your-password' | npm run hash-password\n",
  )
  exit(1)
}

const password = await readPassword()
if (password.length < 12 || password.length > 200) {
  stderr.write('Password must be 12–200 characters.\n')
  exit(1)
}

const hashed = await hash(password, 12)
stdout.write(`ADMIN_PASSWORD_HASH=${hashed.replaceAll('$', '\\$')}\n`)

async function readPassword() {
  if (!stdin.isTTY) {
    const chunks = []
    for await (const chunk of stdin) chunks.push(chunk)
    return Buffer.concat(chunks).toString('utf8').replace(/\r?\n$/, '')
  }

  stderr.write('Password: ')
  stdin.setRawMode(true)
  stdin.resume()
  let password = ''

  return new Promise((resolve) => {
    const onData = (chunk) => {
      const text = chunk.toString('utf8')
      for (const ch of text) {
        if (ch === '\r' || ch === '\n' || ch === '\u0004') {
          stdin.setRawMode(false)
          stdin.pause()
          stdin.off('data', onData)
          stderr.write('\n')
          resolve(password)
          return
        }
        if (ch === '\u0003') exit(1)
        if (ch === '\u007f' || ch === '\b') {
          password = password.slice(0, -1)
          continue
        }
        password += ch
      }
    }
    stdin.on('data', onData)
  })
}
