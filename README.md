CircleCI test runner
====================

The proposed way is to add this repository as a git submodule under `tests/test-runner`,
and then use the example CircleCI config file (`configs/circle.yml`) and put it into the
root of your repository.

The package is meant to be included with your app repository where you structured your
app into multiple packages under `packages/` directory.

## Running tests ##

### Using the complete test suite ###

In order to run the test suite locally, first install the required Node.js packages:

```
$ npm install selenium-webdriver mkdirp
```

Then you need to have the ChromeDriver installed and in your path. On Ubuntu you can do the following:

```
$ sudo apt-get install chromium-chromedriver
$ export PATH="$PATH:/usr/lib/chromium-browser"
```

On Mac OS X you can do:

```
$ brew tap homebrew/dupes
$ brew install chromedriver grep
```

When you have this ready, simply execute the test script to run all the tests:

```
$ ./tests/test-runner/test-all.sh
```

During test execution, the browser will open a few times and test results will be printed to the console.

### Testing a single package ###

You can run tests for a single package using `meteor` directly, for example to test the `blaze` package:

```
$ meteor test-packages packages/blaze
```

After running the above command you should open `http://localhost:3000` (replace `localhost` with your IP
address if needed) in your browser to run the tests.
