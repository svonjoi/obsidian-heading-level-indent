// Source https://github.com/Mitcheljager/workshop.codes/blob/8b68d9c76f9d274055114dc7ed54594f78252681/app/javascript/src/utils/codemirror/indentedLineWrap.js
// Adapted from https://github.com/fonsp/Pluto.jl/blob/eb85b0d34b05ee02e61c0316e6f2ea901afe9ab4/frontend/components/CellInput/awesome_line_wrapping.js

import { syntaxTree } from "@codemirror/language";
import {
  EditorState,
  Extension,
  RangeSetBuilder,
  StateField,
  Transaction,
} from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  WidgetType,
} from "@codemirror/view";

export const getStartTabs = (line: string) => /^\t*/.exec(line)?.[0] ?? ""

const getDecorations = (state: EditorState) => {
  const decorations = []

  for (let i = 0; i < state.doc.lines; i ++) {
    const line = state.doc.line(i + 1)

    // const numberOfTabs = getStartTabs(line.text).length
    // if (numberOfTabs === 0) continue

    const linerwapper = Decoration.line({
      attributes: {
        class: "heading_h1"
      }
    })

    decorations.push(linerwapper.range(line.from, line.from))
  }

  return Decoration.set(decorations)
}

/**
 * Plugin that makes line wrapping in the editor respect the identation of the line.
 * It does this by adding a line decoration that adds margin-left (as much as there is indentation),
 * and adds the same amount as negative "text-indent". The nice thing about text-indent is that it
 * applies to the initial line of a wrapped line.
 */
export const indentedLineWrap = StateField.define({
  create(state) {
    return getDecorations(state)
  },
  update(deco, tr) {
    console.log(tr.state);
    
    if (!tr.docChanged) return deco
    return getDecorations(tr.state)
  },
  provide: (f) => EditorView.decorations.from(f)
})





// export const getStartTabs = (line: string) => /^\t*/.exec(line)?.[0] ?? ""

// const getDecorations = (state: EditorState) => {
//   const decorations = []

//   for (let i = 0; i < state.doc.lines; i ++) {
//     const line = state.doc.line(i + 1)
//     const numberOfTabs = getStartTabs(line.text).length
//     if (numberOfTabs === 0) continue

//     const offset = numberOfTabs * state.tabSize

//     const linerwapper = Decoration.line({
//       attributes: {
//         style: `--indented: ${offset}ch;`,
//         class: "indented-wrapped-line"
//       }
//     })

//     decorations.push(linerwapper.range(line.from, line.from))
//   }

//   return Decoration.set(decorations)
// }

// /**
//  * Plugin that makes line wrapping in the editor respect the identation of the line.
//  * It does this by adding a line decoration that adds margin-left (as much as there is indentation),
//  * and adds the same amount as negative "text-indent". The nice thing about text-indent is that it
//  * applies to the initial line of a wrapped line.
//  */
// export const indentedLineWrap = StateField.define({
//   create(state) {
//     return getDecorations(state)
//   },
//   update(deco, tr) {
//     console.log(tr.state);
    
//     if (!tr.docChanged) return deco
//     return getDecorations(tr.state)
//   },
//   provide: (f) => EditorView.decorations.from(f)
// })

