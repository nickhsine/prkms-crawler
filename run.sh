#!/bin/bash

# npm run fetch;
echo "category $1"
echo "timerange $2";
echo "start page $3";
./node_modules/.bin/babel-node ./fetch.js $1 $2 $3;
