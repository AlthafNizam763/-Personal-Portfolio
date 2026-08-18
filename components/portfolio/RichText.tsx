import { Fragment } from 'react'

/**
 * Renders the inline emphasis the original About/Hero copy expressed as
 * hardcoded `<span className="font-semibold">` elements.
 *
 * Admin-authored text stores that emphasis as `**double asterisks**`, which
 * this component converts back to the exact same markup. Text is never
 * injected as HTML, so admin content cannot introduce script tags.
 */
export default function RichText({ text }: { text: string }) {
  if (!text) return null

  // Capturing split keeps the delimiters, so odd indices are the bold runs.
  const parts = text.split(/\*\*(.+?)\*\*/g)

  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="font-semibold">
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  )
}
