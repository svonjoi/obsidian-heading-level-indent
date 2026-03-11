**Indenting content under headers based on their level** is a visual technique to create a visual hierarchy that makes it easier to understand the structure and organization of your document and facilitates the application of **selective attention** on specific structure part. 

Indentation for each heading's content can be customized in the plugin settings.

## Install

Download available through Community plugins in Obsidian settings

<a href="https://obsidian.md/plugins?id=heading-level-indent"><img src="https://img.shields.io/badge/dynamic/json?query=%24%5B%22heading-level-indent%22%5D.downloads&amp;url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json&amp;label=Downloads:&amp;logo=obsidian&amp;color=8c79de&amp;logoColor=8c79de" alt="GitHub Downloads (specific asset, latest release)"></a>

## Demo

![demo](https://github.com/user-attachments/assets/1efed823-a2f4-49cb-a036-fad4d7614488)

## Features

- indentation for elements in editing/preview modes
  - [x] callout
  - [x] table
  - [x] latex block
  - [x] note block embed
  - [x] pdf embed
  - [x] image embed
  - [x] excalidraw embed
  - [x] canvas embed
- [X] indentation in pdf export https://github.com/svonjoi/obsidian-heading-level-indent/issues/6
- [ ] indentation within callouts https://github.com/svonjoi/obsidian-heading-level-indent/issues/5
- [ ] indentation within canvas

## About This Folk

### 🐞 Bug Fix: No indentation in PDF export


### ✨ New Feature: Frontmatter-based heading indent toggle

A new standalone listener, **`VHeadingLevelIndentListener`**, has been introduced to monitor changes to the `vheadinglevelindent` frontmatter field.

* Listens for metadata changes in the active file
* Enables or disables heading indent in real time，Heading indent can be toggled using the frontmatter property: vheadinglevelindent. Omitting the property or setting vheadinglevelindent to 1 enables indent, while setting it to 0 disables it.
* Triggers a preview re-render when the value changes
* Enable heading indent by default unless vheadinglevelindent is set to 0, If the vheadinglevelindent option is not set, indent will still be applied. Numbering is disabled only when vheadinglevelindent is explicitly set to 0.

This allows users to control heading indent **per document**, without reloading or reopening the file.

## Contributors

<a href="https://github.com/svonjoi/obsidian-heading-level-indent/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=svonjoi/obsidian-heading-level-indent" />
</a>



