# Contribution Guidelines

Want to contribute to this repository? Please read below first:

 - [Issues and Bugs](#issues-and-bugs)
 - [Feature Requests](#feature-requests)
 - [Doc Fixes](#doc-fixes)
 - [Guidelines](#submission-guidelines)
 - [Coding Standards](#coding-standards)
 - [Testing](#testing)
 - [Signing the CLA](#signing-the-cla)

## Issues and Bugs
If you find a bug in the source code or a mistake in the documentation, you can help us by
submitting an issue to this repo. Even better you can submit a Pull Request
with a fix.

**Please see the Submission Guidelines below**.

## Feature Requests
You can request a new feature by submitting an issue to this repo.  Proposed features (with suitable design documentation and reasoning) can be crafted and submitted to this repo as a Pull Request.

**Please see the Submission Guidelines below**.

## Doc Fixes
If you want to help improve the docs, it's a good idea to let others know what you're working on to
minimize duplication of effort.  Comment on an issue to let others know what you're working on, or create a new issue if your work
doesn't fit within the scope of any of the existing doc fix projects.

**Please see the Submission Guidelines below**.

## Submission Guidelines

### Submitting an Issue
Before you submit your issue search the repository.  Maybe your question was already answered.

If your issue appears to be a bug, and hasn't been reported, open a new issue.
Help us to maximize the effort we can spend fixing issues and adding new
features, by not reporting duplicate issues.

### Submitting a Pull Request
Before you submit your pull request consider the following guidelines:

* Search this repo for an open or closed Pull Request
  that relates to your submission. You don't want to duplicate effort.
* If you are contributing as an individual, please review the [Developer Certificate of Origin](http://developercertificate.org/) and sign your commit with the `-s` flag. See more about signing commits [here](https://git-scm.com/book/en/v2/Git-Tools-Signing-Your-Work). If you are contributing on behalf of a corporation, please see our section on [signing the CLA](#signing-the-cla) before sending pull
  requests. We cannot accept code without this.
* Make your changes in a new git branch:

     ```shell
     git checkout -b my-fix-branch master
     ```
* Create your patch, **including appropriate test cases**.
* Follow our [Coding Standards](#coding-standards).
* Test your branch via `npm test` and add new test cases where appropriate per the [testing guidelines](#testing).
* Commit your changes using a descriptive commit message.

     ```shell
     git commit -a
     ```
  Note: the optional commit `-a` command line option will automatically "add" and "rm" edited files.
* Push your branch to GitHub:

    ```shell
    git push origin my-fix-branch
    ```

* In GitHub, send a pull request to the master branch.
* If we suggest changes then:
  * Make the required updates.
  * Re-run `npm test` to ensure tests are still passing.
  * Commit your changes to your branch (e.g. `my-fix-branch`).
  * Push the changes to your GitHub repository (this will update your Pull Request).

If the PR gets too outdated we may ask you to rebase and force push to update the PR:

```
git rebase master -i
git push origin my-fix-branch -f
```

*WARNING. Squashing or reverting commits and forced push thereafter may remove GitHub comments
on code that were previously made by you and others in your commits.*

That's it! Thank you for your contribution!

#### After your pull request is merged

After your pull request is merged, you can safely delete your branch and pull the changes
from the main (upstream) repository:

* Delete the remote branch on GitHub either through the GitHub web UI or your local shell as follows:

    ```shell
    git push origin --delete my-fix-branch
    ```

* Check out the master branch:

    ```shell
    git checkout master -f
    ```

* Delete the local branch:

    ```shell
    git branch -D my-fix-branch
    ```

* Update your master with the latest upstream version:

    ```shell
    git pull --ff upstream master
    ```

## Coding Standards
To ensure consistency throughout the source code, keep these rules in mind as you are working:

### Linting

We enforce some style rules for code in this repository using [eslint](http://eslint.org/). You can install a linting addon to a lot of editors and IDEs that will follow our linting rules.

We use [Strongloop's](https://github.com/strongloop/eslint-config-strongloop) eslint configuration module, which is installed via `npm`.  If you are using a linting addon and are seeing weird error messages, they can likely be fixed by running `npm i`.

If you decide to not install a linter addon, or cannot, you can run `npm run lint` to get a report of any style issues. Any issues not fixed will be caught during CI, and _will_ prevent merging.

## Testing

All code changes that impact test cases should also be accompanied with the appropriate changes to the test cases.  Changes that result in a loss of coverage may be denied.  

In general, `hubot-ibmcloud-*` libraries are tested using the [hubot-test-helper](https://github.com/mtsmfm/hubot-test-helper) in conjunction with [portend](https://github.com/nsand/portend), a library that promisifies the events that the Hubot scripts emit.  This is the recommended pattern for testing `hubot-ibmcloud-*` scripts to ensure that assertion errors cause tests to fail and the actual error is surfaced through the test runner, as opposed to surfacing as timeouts that have to be investigated by developers.

At the top level of each test suite, we mock the required dependencies and create the mocked room using `hubot-test-helper`:

```
before(function() {
	mockUtils.setupMockery();
	mockESUtils.setupMockery();
	// initialize cf, hubot-test-helper doesn't test Middleware
	cf = require('hubot-cf-convenience');
	return cf.promise.then();
});

beforeEach(function() {
	room = helper.createRoom();
});

afterEach(function() {
	room.destroy();
});
```


An example of testing a script that emits a text message:

```
it('should respond with current space', function() {
	room.user.say('mimiron', '@hubot space current');

	return portend.once(room.robot, 'ibmcloud.formatter').then(events => {
		expect(events[0].message).to.be.a('string');
		expect(events[0].message).to.eql(`${i18n.__('space.current', 'testSpace')}`);
	});
});
```

An example of testing a script that emits something with an attachment:

```
it('should respond with the spaces', function() {
	room.user.say('mimiron', '@hubot list my spaces');

	return portend.once(room.robot, 'ibmcloud.formatter').then(event => {
		expect(event[0].attachments.length).to.eql(1);
		expect(event[0].attachments[0].title).to.eql('testSpace');
	});
});
```

An example of testing a script that emits multiple events:

```
it('should respond with the cannot find the space', function() {
	room.user.say('mimiron', '@hubot space set unknownSpace');

	return portend.twice(room.robot, 'ibmcloud.formatter').then(events => {
		expect(events[0].message).to.eql(i18n.__('space.set.in.progress', 'unknownSpace'));
		expect(events[1].message).to.eql(i18n.__('space.not.found', 'unknownSpace'));
	});
});
```

## Signing the CLA

Please sign our Contributor License Agreement (CLA) before sending pull requests if you are acting on behalf of a corporation. For any code
changes to be accepted, the CLA must be signed.

* [For corporations](./cla-corporate.pdf).
