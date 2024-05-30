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
  EditorView } from "@codemirror/view";

export const indentStateField = StateField.define<DecorationSet>({
  create(state): DecorationSet {
    return getDecorationSet(state); // initial value
  },

  /**
   * lifecicle for an update: DOM event -> transaction -> create new state -> view update
   * todo: return if no heading were changed or created, or no new line were added
   */
  update(currentValue: DecorationSet, tr: Transaction): DecorationSet {
    if (!tr.docChanged) return currentValue;
    return getDecorationSet(tr.state);
  },
  
  // this shit is for painting shit using statefield value
  provide(field: StateField<DecorationSet>): Extension {
    return EditorView.decorations.from(field);
  },
});

function getDecorationSet(state: EditorState) {

  /**
   * scan headings across document
   */
  const settings = (window as any).app.plugins.plugins['heading-level-indent'].settings;

  const headings: {text: string; level: number; headingLineNumber: number; }[] = [];
  const embeds: {from: number; to: number, embedLineNumber: number; }[] = [];
  syntaxTree(state).iterate({
    enter(node) {
      // console.log(node);

      if (node.type.name.startsWith('HyperMD-header_HyperMD-header-')){
        const lineAt = state.doc.lineAt(node.from); // props: from, to, text, number
        const text = state.doc.sliceString(node.from, node.to);
        const level = Number(node.type.name.slice(-1));
        
        headings.push({
          text: text,
          level: level,
          headingLineNumber: lineAt.number
        });
      }

      // if (node.type.name.startsWith('internal-embed')){
      //   console.log('🔑 embed found');
        
      //   const lineAt = state.doc.lineAt(node.from);
        
      //   embeds.push({
      //     from: lineAt.from,
      //     to: lineAt.to,
      //     embedLineNumber: lineAt.number
      //   });
      // }
    },
  });
  
  // console.log(headings);
  // console.log(embeds);

  /**
   * apply indenting based on existing headings
   * todo: do not indent if heading structure were not changed; user facade
   */
  const builder = new RangeSetBuilder<Decoration>();
  // const containerWidth = document.getElementsByClassName('cm-content')[0]?.clientWidth;
 
  const el = document.querySelector(".workspace-leaf.mod-active .cm-content");
  if (el === null) return Decoration.none;
  
  const containerWidth = parseInt(getComputedStyle(el).width);

  for (const [index, heading] of headings.entries()) {
    
    const { level, headingLineNumber } = heading;
    const headingLine = state.doc.line(headingLineNumber);

    const firstDataLineNumber = headingLineNumber+1;
    const lastDataLineNumber = headings[index+1]?.headingLineNumber-1 || state.doc.lines;

    const pxForDataLine = settings[`h${level}`] || 0;
    const pxForHeadingLine = settings[`h${level-1}` || 0];

    const dataStyles = 
      `left:${pxForDataLine}px;` +
      // we indent on the left side, so we need to reduce the width of the line also
      `width:${containerWidth-pxForDataLine}px`;

    const headingStyles = 
      `left:${pxForHeadingLine}px;` +
      `width:${containerWidth-pxForHeadingLine}px`;

    builder.add(
      headingLine.from,
      headingLine.from,
      Decoration.line({
        attributes: {style:headingStyles}
      })
    );
    
    for (let j = firstDataLineNumber; j < lastDataLineNumber+1; j++) {
      const dataLine = state.doc.line(j);
      builder.add(
        dataLine.from,
        dataLine.from,
        Decoration.line({
          attributes: {style:dataStyles}
        })
      );
    }
  }

  return builder.finish();
}
