# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [1.2.0] - 04-07-2017

### Added
- Added CHANGELOG to the repository root.
- zero-touch build task in Gulp.
- Clipboard works now on OSX.
- Time entries can now be started simply by pressing enter.
- App checks for available updates on startup.

### Removed
- Credits and author info from the app footer.

## [1.3.0] - 05-10-2018

### Added

- Created a plugin system to allow custom plugins be declared in a plugins.json file.
- Added Agnostic endpoint plugin, where entries json can be sent arbitrarily (still a bit rigid though).
- Moved all existing plugins (jira and custom_endpoint) into plugin directories and declare them in .json.
- Introduced PluginManager to keep track of enabled plugins as app-data, in a .json file.
- Updated node-webkit version to 0.33.3 and improved the way builds are triggered.

## [1.4.0] - 03-06-2020

### Added

- New UI Settings window to allow defining a list of projects to show as a dropdown in the Time Entry widget.
- Added nwjs package to simplify local development.
