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
import { editorLivePreviewField } from 'obsidian';

export const indentStateField = StateField.define<DecorationSet>({
  /**
   * initial value
   */
  create(state): DecorationSet {
    return Decoration.none;
  },

  /**
   * lifecicle for an update: DOM event -> transaction -> create new state -> view update
   *
   */
  update(currentValue: DecorationSet, tr: Transaction): DecorationSet {
		const builder = new RangeSetBuilder<Decoration>();
    const livepreview = tr.state.field(editorLivePreviewField);
    
    /**
     * scan headings across document and line numbers
     */
    syntaxTree(tr.state).iterate({
      enter(node) {
        if (!node.type.name.startsWith('HyperMD-header_HyperMD-header-')) { return; }

        const lineAt = tr.state.doc.lineAt(node.from); // props: from, to, text, number
        const lineNumber = lineAt.number;

        // const lineAtFrom = lineAt.from;
        // const lineAtTo = lineAt.to;

        const from = node.from;
        const to = node.to;

        const text = tr.state.doc.sliceString(node.from, node.to);
        const level = Number(node.type.name.slice(-1));

        // console.log(`🗡 ${text} -- level:${level} -- l:${lineNumber}`);
        console.log(`🔑 ${text} | from:${from} | to:${to}`);
        

      },
    });
    

    /**
     * apply indenting based on existing headings
     */

    // builder.add(
    //   node.from-1,
    //   node.to,
    //   Decoration.mark({
    //     // attributes: { class: `heading_h${level}`}
    //     // attributes: {style: "left: 50px"}
    //   })
    // );

    return builder.finish();
  },
  /**
   * this shit is for painting shit using statefield value
   */
  provide(field: StateField<DecorationSet>): Extension {
    return EditorView.decorations.from(field);
  },
});
