/* eslint-disable @typescript-eslint/no-unused-vars */
import { syntaxTree } from "@codemirror/language";
import { StateField, StateEffect, EditorState, Extension, RangeSetBuilder, Transaction } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, WidgetType, } from "@codemirror/view";

export const indentLinesStateField = StateField.define<DecorationSet>({
  create(state): DecorationSet {
    return getDecorations(state)
  },
  update(deco: DecorationSet, tr: Transaction): DecorationSet {
    if (!tr.docChanged) return deco
    return getDecorations(tr.state)
  },
  provide(field: StateField<DecorationSet>): Extension {
    return EditorView.decorations.from(field);
  },
});

const getDecorations = (state: EditorState) => {
  const decorations = []

  for (let i = 0; i < state.doc.lines; i ++) {
    const line = state.doc.line(i + 1)
    
    // console.log(state.facet());
    
    const linerwapper = Decoration.line({
      attributes: {
        style: `left:50px`,
        class: "indented-wrapped-line"
      }
    })

    decorations.push(linerwapper.range(line.from, line.from))
  }

  return Decoration.set(decorations)
}

// import { Range, RangeSet, StateEffect, StateField } from "@codemirror/state";
// import { Decoration, EditorView } from "@codemirror/view";

// export const addMark = StateEffect.define<Range<Decoration>>(), clearMarks = StateEffect.define(),
//     removeMarkBySpecAttribute = StateEffect.define<{ attribute: string, reference: any }>()

// export const IndentStateField = StateField.define<RangeSet<Decoration>>({
//     create() {
//         return Decoration.none;
//     },
//     update(value, tr) {
//         value = value.map(tr.changes);

//         for (let effect of tr.effects) {
//             if (effect.is(addMark))
//                 value = value.update({ add: [effect.value]/*, sort: true*/ });
//             else if (effect.is(clearMarks))
//                 value = value.update({ filter: () => false });
//             else if (effect.is(removeMarkBySpecAttribute))
//                 value = value.update({ filter: (from, to, ref) => ref.spec[effect.value.attribute] !== effect.value[effect.value.attribute] });
//         }

//         return value;
//     },
//     provide: f => EditorView.decorations.from(f)
// })


// codemirror forum - indent wrapped code
// https://discuss.codemirror.net/t/making-codemirror-6-respect-indent-for-wrapped-lines/2881/8

// todo: reference for postprocessor for reading view
// https://github.com/andyzito/obsidian-nice-kbds/blob/19eb45a607d15fb4ca5560947497da4ab77d22bc/main.ts#L183

// todo: https://github.com/tkat0/obsidian-scrapbox-flavored/blob/35c7f3719c7009b3f1d3fcdaf3c67d90850ccdaf/packages/styles/src/field.ts#L11