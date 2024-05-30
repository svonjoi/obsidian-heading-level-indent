**Indenting content under headers based on their level** is a visual technique to create a visual hierarchy that makes it easier to understand the structure and organization of your document and facilitates the application of **selective attention** on specific structure part. 

- You can specify the margins for the content of each heading in plugin settings
- Also you can add your own custom css to the headings and their content, using the classes `data_h1/2/3/4/5/6` and `heading_h1/2/3/4/5/6` appended to each rendered section in reading view

## Preview

![image](https://github.com/svonjoi/obsidian-heading-level-indent/assets/58810368/bb4dcf60-edff-4c3a-9c24-a06986b888d9)

## Install

You can download from *Community plugins* in Obsidian settings

## Knowing issues

- when reloading obsidian with any open file, you need edit any character for indentation apply (editing mode)
- when resizing obisdian window, you need edit any character for indentation apply (editing mode)
- in huge files, the bottom of document is not indented before you edit something there. So if you just scroll to the bottom you will see incorrent indentation (editing mode)
- not working with preview embeds (pictures, another nothes,..) in live-preview
- glitches on scroll through the longer section of a heading (reading mode)
- no indentation within callouts

## Advanced

You can combine different heading indent with custom CSS. For example, I prefer use h1 heading as title of a note in custom centered format, and the rest of headings as hierarchy, each one with different format in order to make more visual difference:

This plugin is handly combined with `fold heading` option and [creases](https://github.com/liamcain/obsidian-creases) plugin to assign folding of specific heading level to a shortcut
