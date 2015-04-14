#!/bin/bash

PACKAGE="$1"
if [ -z "${PACKAGE}" ]; then
  echo "ERROR: No package specified."
  exit 1
fi

# Move to the correct directory.
cd "$( dirname "${BASH_SOURCE[0]}" )/.."

# Spawn the test process.
echo "  > Spawning test process..."
meteor test-packages --once --driver-package 'test-in-console' -p 4096 ${PACKAGE} >/dev/null 2>/dev/null &
METEOR_PID=$!
# Ensure that the process is killed on exit.
trap "kill ${METEOR_PID}" EXIT

echo "  > Waiting for Meteor to initialize..."
sleep 15

# Run the test.
echo "  > Running the test runner..."
node tests/runner.js
exit $?

