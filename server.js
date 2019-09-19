// node server.js
// ngrok http 3000
// LineのwebhookURLを書き換える

'use strict'

class Kusa {
  constructor () {
    this.RakutenMA = require('rakutenma')
    this.fs = require('fs')

    var model = JSON.parse(this.fs.readFileSync(__dirname + '/model_ja.min.json'))
    this.rma = new this.RakutenMA(model, 1024, 0.007812) // SCW のハイパーパラメータを指定
    this.rma.featset = this.RakutenMA.default_featset_ja

    // 素性ハッシング関数 (15bit) を指定
    this.rma.hash_func = this.RakutenMA.create_hash_func(15)

    this.insertKusa = ['I-c', 'P-rj', 'P-k', 'P-sj']
    this.replaceKusa = ['M-c', 'M-p', 'W']

    this.kusaMin = 2
    this.kusaMax = 6
  }

  randomKusa () {
    this.insertionNumber = Math.floor(Math.random() * (this.kusaMax + 1 - this.kusaMin)) + this.kusaMin
    return 'ｗ'.repeat(this.insertionNumber)
  }

  angry (text) {
    let re = /オウム|おうむ/
    if (re.test(text)) {
      return true
    } else {
      return false
    }
  }

  glow (text) {
    text = this.rma.tokenize(text)

    if (this.angry(text)) {
      return 'は？誰に向かってオウムって言ってる？？？'
    }

    this.result = ''
    for (let i = 0; i < text.length; i++) {
      if (text[i][0].match(/[ 　！＠＃＄％＾＆＊（）＿＋｛｝：”｜＜＞？!"#$%&'()\*\+\-\.,\/:;<=>?@\[\\\]^_`{|}~]/g)) {
        this.result += text[i][0]
        continue
      }

      if (this.replaceKusa.includes(text[i][1])) {
        this.result += this.randomKusa()
        continue
      }

      this.result += text[i][0]

      if (this.insertKusa.includes(text[i][1])) {
        this.result += this.randomKusa()
      }
    }

    this.result += this.randomKusa()

    return this.result
  }
}

const express = require('express')
const line = require('@line/bot-sdk')
const PORT = process.env.PORT || 3000
require('dotenv').config()

const config = {
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
}

const app = express()
const kusa = new Kusa()

app.post('/', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
})

const client = new line.Client(config)

const handleEvent = event => {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null)
  }

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: kusa.glow(event.message.text) // 実際に返信の言葉を入れる箇所
  })
}

(process.env.NOW_REGION) ? module.exports = app : app.listen(PORT)
console.log(`Server running at ${PORT}`)
