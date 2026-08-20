import { tokenizeLine, type Token } from '@/lib/tasks/syntax'
import { categoryColor, type Category } from '@/lib/taxonomy'

/** Habit name, lowercased, to the part of life it belongs to. */
export type References = Record<string, Category>

const KIND_CLASS: Record<Token['kind'], string> = {
  reference: 'underline decoration-dotted underline-offset-4',
  head: '',
  punct: 'text-ink-faint',
  number: 'text-figure',
  name: '',
  plain: '',
}

type Painted = { className: string; colour?: string; hint?: string }

/**
 * A `head` token is the first word of a line with no dot in it. It is a
 * reference only if a habit answers to that name — which is how "Sit"
 * reads as a habit while "Buy" stays an ordinary word.
 */
function paint(token: Token, references: References): Painted {
  if (token.kind !== 'reference' && token.kind !== 'head') {
    return { className: KIND_CLASS[token.kind] }
  }

  const category = references[token.text.toLowerCase()]

  if (category) {
    return { className: KIND_CLASS.reference, colour: categoryColor(category) }
  }
  if (token.kind === 'head') return { className: '' }

  return {
    className: 'underline decoration-wavy underline-offset-4',
    colour: 'var(--alert)',
    hint: 'Written like a link, but no habit by that name',
  }
}

/**
 * One line, painted.
 *
 * A habit takes the colour of the part of life it serves, the same three
 * hues the dashboard uses. Figures and punctuation are highlighted the
 * way an editor highlights them. The name is the only thing left plain,
 * because the name is the only thing that is just words.
 *
 * The same component paints the read-only list and the editor overlay, so
 * the two can never drift apart.
 */
export function TaskText({
  raw,
  references,
  className = '',
}: {
  raw: string
  references: References
  className?: string
}) {
  return (
    <span className={className}>
      {tokenizeLine(raw).map((token, index) => {
        const { className: paintClass, colour, hint } = paint(token, references)

        return (
          <span
            key={`${index}-${token.text}`}
            style={{ color: colour }}
            title={hint}
            className={paintClass}
          >
            {token.text}
          </span>
        )
      })}
    </span>
  )
}

/** The clock column, highlighted the same way figures are in a line. */
export function ClockText({ text }: { text: string }) {
  return (
    <>
      {text.split(/([:\u2013-])/).map((piece, index) => (
        <span
          key={`${index}-${piece}`}
          className={/^[:\u2013-]$/.test(piece) ? 'text-ink-faint' : 'text-figure'}
        >
          {piece}
        </span>
      ))}
    </>
  )
}
