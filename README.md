# CONSOLE-LOG-MY-FOOD

> DEMO Application serving as practice for Javascript ES6 iterators, iterables objs and generators.

## Functionality

1. The app is run from the command line.
2. The user is asked what they ate, and how much. 
3. Calories of the meal are calculated and displayed.

## Features of the App

1. List Food Specific to Dietary Preferences
   - Terminal Commands implemented through "event listeners"
2. Log Food of different portions
   - Implemented using Iterators / Generators
3. List logged food for a specific day
   - Implemented using YIELD Delegation / "Composing generator functions"

> Database set up using JSON Server.

## Packages Used:

Readline -> Setup input / output environment
JSON Server -> Setup a full fake REST API

```bash
Install Dependecies:	npm install

Install :  sudo npm i -g json-server

RUN     :  json-server --watch ./db.json --port 3001
OR      :  npm run server

```

AXIOS -> Promise based HTTP client.
