#!/bin/bash

# Packages with tests. To ignore a package, place // NOTEST after the onTest definition.
PACKAGES=$(grep -Prl 'Package\.(onTest|on_test)(?!.*// NOTEST)' packages | grep -Po 'packages/\K.*(?=/)' | sort -u)

# Move to the correct directory.
cd "$( dirname "${BASH_SOURCE[0]}" )/.."

# Perform tests.
TESTS_FAILED=0
PACKAGES_FAILED=""
for pkg in ${PACKAGES}; do
  echo ">>> Testing package '${pkg}'..."
  ./tests/test-package.sh packages/${pkg} || {
    echo "ERROR: Tests for package '${pkg}' failed."
    TESTS_FAILED=1
    PACKAGES_FAILED="${PACKAGES_FAILED} ${pkg}"
  }
done

if [ "${TESTS_FAILED}" == "1" ]; then
  echo "ERROR: Some of the packages have failing tests:"
  echo "ERROR: ${PACKAGES_FAILED}"
  echo "ERROR: For details see output above."
fi

exit ${TESTS_FAILED}
