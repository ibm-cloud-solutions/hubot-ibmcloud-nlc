# Contribution Guidelines

Want to contribute to this repository? Please read below first:

 - [Issues and Bugs](#issues-and-bugs)
 - [Feature Requests](#feature-requests)
 - [Doc Fixes](#doc-fixes)
 - [Guidelines](#submission-guidelines)
 - [Coding Standards](#coding-standards)
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
* Please sign our [Contributor License Agreement (CLA)](#signing-the-cla) before sending pull
  requests. We cannot accept code without this.
* Make your changes in a new git branch:

     ```shell
     git checkout -b my-fix-branch master
     ```
* Create your patch, **including appropriate test cases**.
* Follow our [Coding Standards](#coding-standards).
* Test your branch via `npm test`
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

## Signing the CLA

Please sign our Contributor License Agreement (CLA) before sending pull requests. For any code
changes to be accepted, the CLA must be signed.

* [For individuals](./cla-individual.pdf).
* [For corporations](./cla-corporate.pdf).
