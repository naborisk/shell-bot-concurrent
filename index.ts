import { Client, CoreMessage } from '@concurrent-world/client'
import * as cowsay from 'cowsay'
import { rollDice } from './modules/dice'

const commandPrefix = Bun.env.COMMAND_PREFIX || '/sh'

const secretKey = Bun.env.SECRET_KEY || ''
const host = Bun.env.CONCURRENT_HOST || ''
const clientSig = 'shell-bot-concurrent'
const postStream = Bun.env.POST_STREAM || ''

const client = new Client(secretKey, host, clientSig)

const streamSubscription = await client.newSubscription()
streamSubscription.listen([postStream])

streamSubscription.on('MessageCreated', async e => {
  const coreMessage = e.body as CoreMessage<any>
  if (coreMessage.author === client.ccid) return

  const message = coreMessage.payload.body
  console.log(message)

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
    console.log(`coreMessagcoreMessage.id, coreMessage.author: ${coreMessage.id}, ${coreMessage.author}`)

    switch (command) {
      case `ping`:
        await client.reply(coreMessage.id, coreMessage.author, [postStream], `pong`)
        break

      case 'echo':
        await client.reply(
          coreMessage.id,
          coreMessage.author,
          [postStream],
          args.join(' ').trimStart()
        )
        break

      case 'cowsay':
        await client.reply(
          coreMessage.id,
          coreMessage.author,
          [postStream],
          '```' + cowsay.say({ text: args.join(' ') }) + '```'
        )
        break

      case 'cowthink':
        await client.reply(
          coreMessage.id,
          coreMessage.author,
          [postStream],
          '```' + cowsay.think({ text: args.join(' ') }) + '```'
        )
        break

      case 'roll':
        const [count, sides] = args.join('').split('d').map(Number)
        const arr: Number[] = Array.from(Array(Number(count)))
        const res = arr.map(() => rollDice(sides.toString()))

        await client.reply(
          coreMessage.id,
          coreMessage.author,
          [postStream],
          `${count}個の${sides}面サイコロを振りました
          合計: ${res.reduce((acc, cur) => acc + cur)}\n${res.join(' ')}`
        )
        break

      case 'jpdict':
        const proc = Bun.spawn(['myougiden', ...args])
        const text = await new Response(proc.stdout).text()
        await client.reply(coreMessage.id, coreMessage.author, [postStream], text)
        break

      case 'current':
        await client.reply(
          coreMessage.id,
          coreMessage.author,
          [postStream],
          `只今${new Date().toLocaleTimeString('ja-JP')}でございます。`
        )
        break

      case 'help':
        await client.reply(
          coreMessage.id,
          coreMessage.author,
          [postStream],
          '```' +
            `
コマンド一覧:
  ping: pongを返す
    /con ping
  cowsay: Linuxのcowsayコマンドと同じ
    /con cowsay <text>
  cowthink: Linuxのcowthinkコマンドと同じ
    /con cowthink <text>
  roll: サイコロを振る
    /con roll <個数>d<面数>
  jpdict: 辞書で単語を検索
    /con jpdict <word>`
        )
        break

      default:
        await client.reply(coreMessage.id, coreMessage.author, [postStream], `unknown command`)
        break
    }
  }
})
