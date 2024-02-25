import { Client } from '@concurrent-world/client'
import * as cowsay from 'cowsay'
import { rollDice } from './modules/dice'

const commandPrefix = Bun.env.COMMAND_PREFIX || '/sh'

const secretKey = Bun.env.SECRET_KEY || ''
const host = Bun.env.CONCURRENT_HOST || ''
const clientSig = 'shell-bot-concurrent'
const postStream = Bun.env.POST_STREAM || ''
const ccid = Bun.env.CCID || ''

;(async () => {
  const client = await Client.create(secretKey, host, clientSig)

  const sub = await client.newSubscription()
  await sub.listen([postStream])

  let replied = true

  sub.on('MessageCreated', async s => {
    if (s.body.author === ccid) return
    console.log(s)
    replied = false

    // the message object
    const m = await client.getMessage(s.body.id, s.body.author)

    const message = s.body.payload.body

    const command = s.body.payload.body.body
      .slice(commandPrefix.length)
      .trimStart()
      .split(' ')[0]

    console.log(`command: ${command}`)

    const args = message.body
      .slice(commandPrefix.length + command.length + 1)
      .trimStart()
      .split(' ')

    if (!replied && message.body && message.body.startsWith(commandPrefix)) {
      console.log(`command: ${command}`)
      console.log(`args: ${typeof args} ${JSON.stringify(args)}`)
      console.log(`s.body.id, s.body.author: ${s.body.id}, ${s.body.author}`)

      replied = true
      console.log('replied')

      switch (command) {
        case `ping`:
          await m?.reply([postStream], `pong`)
          break

        case 'echo':
          await m?.reply([postStream], args.join(' ').trimStart())
          break

        case 'cowsay':
          await m?.reply(
            [postStream],
            '```' + cowsay.say({ text: args.join(' ') }) + '```'
          )
          break

        case 'cowthink':
          await m?.reply(
            [postStream],
            '```' + cowsay.think({ text: args.join(' ') }) + '```'
          )
          break

        case 'roll':
          const [count, sides] = args.join('').split('d').map(Number)
          if (!count || !sides) {
            await m?.reply([postStream], 'invalid input')
            break
          }

          const arr: Number[] = Array.from(Array(Number(count)))
          const res = arr.map(() => rollDice(sides.toString()))

          await m?.reply(
            [postStream],
            `${count}個の${sides}面サイコロを振りました
              合計: ${res.reduce((acc, cur) => acc + cur)}\n${res.join(' ')}`
          )
          break

        case 'jpdict':
          const proc = Bun.spawn(['myougiden', ...args])
          const text = await new Response(proc.stdout).text()
          await m?.reply([postStream], text)
          break

        case 'current':
          await m?.reply(
            [postStream],
            `只今${new Date().toLocaleTimeString('ja-JP')}でございます。`
          )
          break

        case 'help':
          await m?.reply(
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
          await m?.reply([postStream], `unknown command`)
          break
      }
    }
  })
})()
