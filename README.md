# discord-gnosis-bot
Very simple js discord Ethereum gnosis bot.

Uses a simple json file (src/package.json, created/read on start) to store multisig state and compare it with the api call.
If the state changed, notifications are sent to a given discord channel (see .env.example).

Notifications currently available:
* New transaction submitted.
* Transaction previously submitted executed.

## Usage

* ```cp .env.example .env```
* Edit .env content
* ```yarn```
* ```yarn start```

## Available on

* Sushiswap (soon)
