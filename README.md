**Indenting content under headers based on their level** is a visual technique to create a visual hierarchy that makes it easier to understand the structure and organization of your document and facilitates the application of **selective attention** on specific structure part.

Indentation for each heading's content can be customized in the plugin settings.

## Install

Download available through Community plugins in Obsidian settings

<a href="https://obsidian.md/plugins?id=heading-level-indent"><img src="https://img.shields.io/badge/dynamic/json?query=%24%5B%22heading-level-indent%22%5D.downloads&amp;url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json&amp;label=Downloads:&amp;logo=obsidian&amp;color=8c79de&amp;logoColor=8c79de" alt="GitHub Downloads (specific asset, latest release)"></a>

## Demo

![demo](https://github.com/user-attachments/assets/1efed823-a2f4-49cb-a036-fad4d7614488)

## Indentation support

| Element          | Source/Live Preview | Reading View | PDF Export |
| ---------------- | ------------------- | ------------ | ---------- |
| Code block       | ✅                  | ✅           | ✅         |
| Blockquote       | ✅                  | ✅           | ✅         |
| Callout          | ✅                  | ✅           | ✅         |
| Table            | ✅                  | ✅           | ✅         |
| LaTeX block      | ✅                  | ✅           | ✅         |
| Note block embed | ✅                  | x            | ✅         |
| PDF embed        | ✅                  | ✅           | thumb      |
| Image embed      | ✅                  | ✅           | ✅         |
| Excalidraw embed | N/A                 | ✅           | ?          |
| Canvas embed     | ✅                  | ✅           | ✅         |

## Features

### Per-document indent control

Toggle heading indentation for individual notes using the `heading-indent` frontmatter property:

- **Omit the property** or set to `true`: Indentation enabled (default)
- **Set to `false`**: Indentation disabled

**Example:**

```yaml
---
heading-indent: false
---
```

## Contributors

<a href="https://github.com/svonjoi/obsidian-heading-level-indent/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=svonjoi/obsidian-heading-level-indent" />
</a>
