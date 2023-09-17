import { Client } from '@concurrent-world/client'
import * as cowsay from 'cowsay'
import { rollDice } from './modules/dice'

const commandPrefix = Bun.env.COMMAND_PREFIX || '/sh'

const ccid = Bun.env.CCID || ''
const secretKey = Bun.env.SECRET_KEY || ''
const host = Bun.env.CONCURRENT_HOST || ''
const clientSig = 'shell-bot-concurrent'
const postStream = Bun.env.POST_STREAM || ''

const client = new Client(secretKey, host, clientSig)

const streamSocket = client.newSocket()

streamSocket.ws.on('open', () => {
  console.log('opened')
})

streamSocket.on('error', e => {
  console.error(e)
})

streamSocket.ws.on('close', () => {
  console.log('closed')
})

streamSocket.ws.on('pong', () => {
  Bun.spawn(['touch', '/tmp/pong'])
})

setInterval(() => {
  streamSocket.ws.ping()
}, 1000 * 5)

await streamSocket.waitOpen()
streamSocket.listen([postStream])

streamSocket.on('MessageCreated', async e => {
  if (e.owner === ccid) return

  const message: any = await client.getMessage(e.id, e.owner)

  const command = message.body
    .slice(commandPrefix.length)
    .trimStart()
    .split(' ')[0]

  const args = message.body
    .slice(commandPrefix.length + command.length + 1)
    .trimStart()
    .split(' ')

  if (message.body && message.body.startsWith(commandPrefix)) {
    console.log(`command: ${command}`)
    console.log(`args: ${typeof args} ${JSON.stringify(args)}`)
    console.log(`e.id, e.owner: ${e.id}, ${e.owner}`)

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

      case 'roll':
        const [sides, count] = args.join('').split('d').map(Number)
        const arr: Number[] = Array.from(Array(Number(count)))
        const res = arr.map(() => rollDice(sides.toString()))

        await client.reply(
          e.id,
          e.owner,
          [postStream],
          `${count}個の${sides}面サイコロを振りました
          合計: ${res.reduce((acc, cur) => acc + cur)}\n${res.join(' ')}`
        )
        break

      default:
        await client.reply(e.id, e.owner, [postStream], `unknown command`)
        break
    }
  }
})
