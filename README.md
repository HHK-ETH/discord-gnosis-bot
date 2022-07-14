# discord-gnosis-bot
Very simple js discord Ethereum gnosis bot.

Uses a simple json file (src/package.json, created/read on start) to store multisig state and compare it with the api call ([Gnosis API](https://safe-transaction.gnosis.io/)).
If the state changed, notifications are sent to a given discord channel (see .env.example).

Notifications available:
* New transaction submitted.
* Transaction previously submitted executed.

Commands available:
* /safe-infos => reply with the amount of txs available to sign and execute with an ephemeral message.

## Usage

* ```cp .env.example .env```
* Edit .env content
* ```yarn```
* ```yarn start```

## Available on

* Sushiswap (soon)
