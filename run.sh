#!/bin/bash

# npm run fetch;
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "category $1"
echo "timerange $2";
echo "start page $3";
$DIR/node_modules/.bin/babel-node $DIR/fetch.js $1 $2 $3;
