import 'dotenv/config'
import { Client } from '@concurrent-world/client'
import * as cowsay from 'cowsay'

const commandPrefix = process.env.COMMAND_PREFIX || '/sh'

const ccid = process.env.CCID || ''
const secretKey = process.env.SECRET_KEY || ''
const host = process.env.CONCURRENT_HOST || ''
const clientSig = 'shell-bot-concurrent'
const postStream = process.env.POST_STREAM || ''

const client = new Client(secretKey, host, clientSig)

const streamSocket = client.newSocket()

setInterval(() => {
  console.log(
    `${new Date().toLocaleTimeString()}: ${streamSocket.ws.readyState}`
  )
}, 1000)

await streamSocket.waitOpen()
streamSocket.listen([postStream])

streamSocket.on('MessageCreated', async e => {
  if (e.owner === ccid) return

  const message = await client.getMessage(e.id, e.owner)

  const command = message.body
    .slice(commandPrefix.length)
    .trimStart()
    .split(' ')[0]

  const args = message.body
    .slice(commandPrefix.length + command.length + 1)
    .trimStart()
    .split(' ')

  console.log(`command: ${command}`)
  console.log(`args: ${typeof args} ${JSON.stringify(args)}`)
  console.log(`e.id, e.owner: ${e.id}, ${e.owner}`)

  if (message.body && message.body.startsWith(commandPrefix)) {
    switch (command) {
      case `ping`:
        await client.reply(e.id, e.owner, [postStream], `pong`)
        break

      case 'echo':
        await client.reply(
          e.id,
          e.owner,
          [postStream],
          args.join(' ').trimStart()
        )
        break

      case 'cowsay':
        await client.reply(
          e.id,
          e.owner,
          [postStream],
          '```' + cowsay.say({ text: args.join(' ') }) + '```'
        )
        break

      case 'cowthink':
        await client.reply(
          e.id,
          e.owner,
          [postStream],
          '```' + cowsay.think({ text: args.join(' ') }) + '```'
        )
        break

      default:
        await client.reply(e.id, e.owner, [postStream], `unknown command`)
        break
    }
  }
})

streamSocket.on('error', e => {
  console.error(e)
})

streamSocket.on('close', () => {
  console.log('closed')
})
