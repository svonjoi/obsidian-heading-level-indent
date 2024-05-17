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
import { HeadingDecoration } from "./heading_decoration";

export const indentStateField = StateField.define<DecorationSet>({
  create(state): DecorationSet {
    return Decoration.none;
  },
  update(oldState: DecorationSet, transaction: Transaction): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>();

    syntaxTree(transaction.state).iterate({
      enter(node) {
        
        // console.log(node.type, transaction.state.doc.sliceString(node.from, node.to))
        // console.log(node.type);
        // console.log(transaction.state);
        
        if (node.type.name.startsWith("HyperMD-header_HyperMD-header-")) {
					const headingLevel = Number(node.type.name.slice(-1));
					console.log(headingLevel);
					
					// if (headingLevel > 1) {
					// 	builder.add(
					// 		node.from - 2,
					// 		node.to - 1,
					// 		Decoration.line({
					// 			attributes: { class: `heading_h${headingLevel}`}
					// 		})
					// 	);
					// }
        }
      },
    });

    return builder.finish();
  },
  provide(field: StateField<DecorationSet>): Extension {
    return EditorView.decorations.from(field);
  },
});

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

