# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="1.5.0"></a>
# [1.5.0](https://github.com/edjopato/resilio-sync-watch-config/compare/v1.4.0...v1.5.0) (2018-08-20)


### Features

* improve logging ([78249ac](https://github.com/edjopato/resilio-sync-watch-config/commit/78249ac))
* merge multiple configs ([d749e0a](https://github.com/edjopato/resilio-sync-watch-config/commit/d749e0a))
* restart resilio-sync on crash ([f65c862](https://github.com/edjopato/resilio-sync-watch-config/commit/f65c862))
* use fs.watchFile instead of fs.watch ([2e85e8a](https://github.com/edjopato/resilio-sync-watch-config/commit/2e85e8a))



<a name="1.4.0"></a>
# [1.4.0](https://github.com/edjopato/resilio-sync-watch-config/compare/v1.3.0...v1.4.0) (2017-08-14)


### feat

* allow use of ~ in basepath ([8304bc0](https://github.com/edjopato/resilio-sync-watch-config/commit/8304bc0)), closes [#8](https://github.com/edjopato/resilio-sync-watch-config/issues/8)

### fix

* cleanup tmpFolder before deleting it ([dc5b99e](https://github.com/edjopato/resilio-sync-watch-config/commit/dc5b99e)), closes [#5](https://github.com/edjopato/resilio-sync-watch-config/issues/5)

### refactor

* change resilio from methods to a class ([139b9f6](https://github.com/edjopato/resilio-sync-watch-config/commit/139b9f6)), closes [#7](https://github.com/edjopato/resilio-sync-watch-config/issues/7)
* fix eslint 'no-return-assign' ([66c036c](https://github.com/edjopato/resilio-sync-watch-config/commit/66c036c))
* move ensureTrailingSlash into its own method ([ae94f03](https://github.com/edjopato/resilio-sync-watch-config/commit/ae94f03))
* only import method instead of all methods ([802de52](https://github.com/edjopato/resilio-sync-watch-config/commit/802de52))
* use const for never reassigned variable ([f5d9c39](https://github.com/edjopato/resilio-sync-watch-config/commit/f5d9c39))

### style

* remove semicolon ([019547e](https://github.com/edjopato/resilio-sync-watch-config/commit/019547e))
* use curly braces for singleline if ([351a8ba](https://github.com/edjopato/resilio-sync-watch-config/commit/351a8ba))
* use singlequotes for strings ([c7b9498](https://github.com/edjopato/resilio-sync-watch-config/commit/c7b9498))



<a name="1.3.0"></a>
# [1.3.0](https://github.com/edjopato/resilio-sync-watch-config/compare/v1.2.0...v1.3.0) (2017-08-05)


### chore

* disable travis mail notifications ([d43f907](https://github.com/edjopato/resilio-sync-watch-config/commit/d43f907))
* push version ([a0b7048](https://github.com/edjopato/resilio-sync-watch-config/commit/a0b7048))

### feat

* set resilio binary as cli option ([7b7c9a7](https://github.com/edjopato/resilio-sync-watch-config/commit/7b7c9a7)), closes [#6](https://github.com/edjopato/resilio-sync-watch-config/issues/6)

### fix

* remove keys from README ([703e835](https://github.com/edjopato/resilio-sync-watch-config/commit/703e835))



<a name="1.2.0"></a>
# [1.2.0](https://github.com/edjopato/resilio-sync-watch-config/compare/v1.1.0...v1.2.0) (2017-07-29)


### chore

* push version ([e1e2d3d](https://github.com/edjopato/resilio-sync-watch-config/commit/e1e2d3d))

### feat

* cleanup on exit request (Ctrl + C) ([f0d9cb8](https://github.com/edjopato/resilio-sync-watch-config/commit/f0d9cb8)), closes [#2](https://github.com/edjopato/resilio-sync-watch-config/issues/2)

### fix

* only generate resilio config in tmp folder on start or watchmode ([e21d8f6](https://github.com/edjopato/resilio-sync-watch-config/commit/e21d8f6))

### refactor

* change global consts to function arguments ([08022e4](https://github.com/edjopato/resilio-sync-watch-config/commit/08022e4))
* move console.log on resilio exit to resilio wrapper ([58758cb](https://github.com/edjopato/resilio-sync-watch-config/commit/58758cb))
* move resilio process stuff into a wrapper ([e6c7192](https://github.com/edjopato/resilio-sync-watch-config/commit/e6c7192))
* remove test variable ([b1a5710](https://github.com/edjopato/resilio-sync-watch-config/commit/b1a5710))
* remove unused variable ([480f6f1](https://github.com/edjopato/resilio-sync-watch-config/commit/480f6f1))
* use `cli` for the arguments stuff ([b30b142](https://github.com/edjopato/resilio-sync-watch-config/commit/b30b142))



<a name="1.1.0"></a>
# [1.1.0](https://github.com/edjopato/resilio-sync-watch-config/compare/v1.0.1...v1.1.0) (2017-07-29)


### chore

* push version ([b414b9b](https://github.com/edjopato/resilio-sync-watch-config/commit/b414b9b))

### feat

* create resilio sync.conf in a tmp folder instead of pwd ([3f79ac6](https://github.com/edjopato/resilio-sync-watch-config/commit/3f79ac6)), closes [#4](https://github.com/edjopato/resilio-sync-watch-config/issues/4)



<a name="1.0.1"></a>
## [1.0.1](https://github.com/edjopato/resilio-sync-watch-config/compare/v1.0.0...v1.0.1) (2017-07-29)


### chore

* push version ([ec13f40](https://github.com/edjopato/resilio-sync-watch-config/commit/ec13f40))
* spec dont need to be in the npm package ([539d85e](https://github.com/edjopato/resilio-sync-watch-config/commit/539d85e))

### docs

* add install and usage to the readme ([42803df](https://github.com/edjopato/resilio-sync-watch-config/commit/42803df))
* add travis build status to the README ([f5d307c](https://github.com/edjopato/resilio-sync-watch-config/commit/f5d307c))

### fix

* use variables out of scope again ([07a7b7c](https://github.com/edjopato/resilio-sync-watch-config/commit/07a7b7c))



<a name="1.0.0"></a>
# [1.0.0](https://github.com/edjopato/resilio-sync-watch-config/compare/04132b4...v1.0.0) (2017-07-29)


### chore

* require minimum node v6 ([0967687](https://github.com/edjopato/resilio-sync-watch-config/commit/0967687))
* use `npm init` to add missing stuff ([20f0b66](https://github.com/edjopato/resilio-sync-watch-config/commit/20f0b66))

### feat

* add jasmine with some basic tests ([04132b4](https://github.com/edjopato/resilio-sync-watch-config/commit/04132b4))
* add travis-ci description ([4fa4427](https://github.com/edjopato/resilio-sync-watch-config/commit/4fa4427))
