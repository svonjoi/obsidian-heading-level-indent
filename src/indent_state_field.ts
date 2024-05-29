/* eslint-disable no-constant-condition */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { syntaxTree } from "@codemirror/language";
import { StateField, StateEffect, 
  // concerned about what the document looks like (while also managing the state of the rest of the editor)
  // the state focuses exclusively on re-computing changes to the state based off of inputs and nothing else
  EditorState, 
  Extension, RangeSetBuilder, Transaction } from "@codemirror/state";
import { Decoration, DecorationSet, 
  // concerned about what the DOM looks like
  // may produce a side effect as a result of the change in state
  EditorView, 
  WidgetType, } from "@codemirror/view";
import { HeadingDecoration } from "./heading_decoration";
import { Editor, editorLivePreviewField } from 'obsidian';

export const indentStateField = StateField.define<DecorationSet>({
  /**
   * initial value
   */
  create(state): DecorationSet {
    return getDecorationSet(state);
    // return Decoration.none;
  },

  /**
   * lifecicle for an update: DOM event -> transaction -> create new state -> view update
   * todo: return if no heading were changed or created, or no new line were added
   */
  update(currentValue: DecorationSet, tr: Transaction): DecorationSet {
    if (!tr.docChanged) return currentValue;
    return getDecorationSet(tr.state);
    
    // console.log(headings);
    return currentValue;
  },
  /**
   * this shit is for painting shit using statefield value
   */
  provide(field: StateField<DecorationSet>): Extension {
    return EditorView.decorations.from(field);
  },
});

function getDecorationSet(state: EditorState) {

  const livepreview = state.field(editorLivePreviewField);
  console.log(state);
  

  /**
   * scan headings across document
   */
  const headings: {text: string; level: number; lineNumber: number; }[] = [];
  syntaxTree(state).iterate({
    enter(node) {
      if (!node.type.name.startsWith('HyperMD-header_HyperMD-header-')) return;
      const lineAt = state.doc.lineAt(node.from); // props: from, to, text, number
      const text = state.doc.sliceString(node.from, node.to);
      const level = Number(node.type.name.slice(-1));
      
      headings.push({
        text: text,
        level: level,
        lineNumber: lineAt.number
      });
    },
  });
  
  console.log(headings);
  
  /**
   * apply indenting based on existing headings
   * todo: do not indent if heading structure were not changed; user facade
   */
  
  const builder = new RangeSetBuilder<Decoration>();
  if (true){
    
    for (const [index, heading] of headings.entries()) {
      
      const { level, lineNumber } = heading;
      const line = state.doc.line(lineNumber);
      const firstDataLine = lineNumber+1;
      const lastDataLine = headings[index+1]?.lineNumber-1 || state.doc.lines;

      builder.add(
        line.from,
        line.from,
        Decoration.line({
          attributes: {class: `source_heading_h${level}`}
        })
      );
      
      for (let j = firstDataLine; j < lastDataLine+1; j++) {
        const jline = state.doc.line(j);
        builder.add(
          jline.from,
          jline.from,
          Decoration.line({
            attributes: {class: `source_data_h${level}`}
          })
        );
      }
    }
  }      

  return builder.finish();
}
