#!/bin/bash

cd ~/prkms-crawler;
# npm run fetch;
echo "timerange $1";
echo "start page $2";
./node_modules/.bin/babel-node ./fetch.js $1 $2;
