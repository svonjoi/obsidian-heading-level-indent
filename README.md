# Heading Level Indent

**Indenting content under headers based on their level** is a visual technique to create a visual hierarchy that makes it easier to understand the structure and organization of your document and facilitates the application of **selective attention** on specific structure part. 

- For now, it is only awailable in reading view
- You can specify the margins for the content of each heading in plugin settings
- Also you can add your own custom css to the headings and their content, using the classes `data_h1/2/3/4/5/6` and `heading_h1/2/3/4/5/6` appended to each rendered section in reading view

## Preview

![plugin_preview](https://user-images.githubusercontent.com/58810368/220870821-1d7adf75-d6c8-4f6e-9634-5f10b34cfe95.png)

## Install

You can download from *Community plugins* in Obsidian settings

## Notes

You can combine different heading indent with custom CSS. For example, I prefer use h1 heading as title of a note in custom centered format, and the rest of headings as hierarchy, each one with different format in order to make more visual difference:

Also it is handly combined with `fold heading` option and [creases](https://github.com/liamcain/obsidian-creases) plugin to assign folding of specific heading level to a shortcut

Config:
- h1 identation: 0
- h2 identation: 60
- h3 identation: 120
- h4 identation: 170

![2023-03-14_02-41](https://user-images.githubusercontent.com/58810368/224870488-eabae6d1-eed5-4aa9-b4fc-978d5152b466.png)

## Roadmap

- [ ] fix indenting delay in preview mode
- [ ] fix glitch on scroll through the longer section of a heading
- [ ] add support for source/live preview mode
- [ ] draw a vertical indentation line like in outliner
- [ ] indentation within callouts
