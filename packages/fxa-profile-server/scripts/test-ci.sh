#!/bin/bash -ex

DIR=$(dirname "$0")

cp "$DIR/../../version.json" "$DIR/../config"
yarn workspaces focus fxa-profile-server
NODE_ENV=test yarn test
