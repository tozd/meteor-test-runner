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
# Redirect standard output to file descriptor #3 so we can wait for Meteor to get ready.
{ exec 3< <(meteor test-packages --once --driver-package 'test-in-console' -p 4096 ${PACKAGE}) ; } 2>/dev/null
# Wait until Meteor reports that it is 'listening'.
echo "  > Waiting for Meteor to start..."
while read line; do
   case "$line" in
   *listening*)
      echo "  > Meteor seems ready, going to run tests in a moment."
      sleep 5
      break
      ;;
   *)
      ;;
   esac
done <&3

# Run the test.
echo "  > Running the test runner..."
node tests/runner.js
RESULT=$?

# Close the file descriptor.
exec 3<&-
killall node 2>/dev/null
wait 2>/dev/null
exit $RESULT

