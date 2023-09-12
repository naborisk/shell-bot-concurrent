import { Client } from '@concurrent-world/client'

const commandPrefix = '/nya'

const secretKey = Bun.env.SECRET_KEY || ''
const host = Bun.env.CONCURRENT_HOST || ''
const clientSig = 'shell-bot-concurrent'
const postStream = Bun.env.POST_STREAM || ''

const client = new Client(secretKey, host, clientSig)

const streamSocket = client.newSocket()

await streamSocket.waitOpen()
streamSocket.listen([postStream])

streamSocket.on('MessageCreated', async e => {
  const message: any = await client.getMessage(e.id, e.owner)
  if (message.body && message.body.startsWith(commandPrefix)) {
    switch (message.body) {
      case `${commandPrefix} ping`:
        await client.reply(e.id, e.owner, [postStream], `pong`)
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
