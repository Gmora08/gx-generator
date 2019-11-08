#!/bin/sh
set -e

echo "Starting SSH ..."
rc -s sshd start

npm start
