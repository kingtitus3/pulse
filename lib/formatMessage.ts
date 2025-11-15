/**
 * Parse message formatting and return React elements or HTML
 * Supports: *bold*, _italic_, ~underline~, [color:XXXXXX]text[/color]
 */

export interface FormattedPart {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  color?: string
}

export function parseMessageFormat(content: string): FormattedPart[] {
  const parts: FormattedPart[] = []
  let currentIndex = 0
  let currentFormat: Partial<FormattedPart> = {}

  // Regex patterns
  const colorPattern = /\[color:([0-9A-Fa-f]{6})\](.*?)\[\/color\]/g
  const boldPattern = /\*([^*]+)\*/
  const italicPattern = /_([^_]+)_/
  const underlinePattern = /~([^~]+)~/

  // First, handle color tags (they can contain other formatting)
  const colorMatches: Array<{
    start: number
    end: number
    color: string
    content: string
  }> = []

  let match
  while ((match = colorPattern.exec(content)) !== null) {
    colorMatches.push({
      start: match.index,
      end: match.index + match[0].length,
      color: '#' + match[1],
      content: match[2],
    })
  }

  // Process content, handling color blocks specially
  let lastIndex = 0
  const processedIndices = new Set<number>()

  for (const colorMatch of colorMatches) {
    // Add text before this color block
    if (colorMatch.start > lastIndex) {
      const beforeText = content.substring(lastIndex, colorMatch.start)
      parts.push(...parseFormattingInText(beforeText, currentFormat))
    }

    // Process the colored content
    const coloredParts = parseFormattingInText(colorMatch.content, {
      ...currentFormat,
      color: colorMatch.color,
    })
    parts.push(...coloredParts)

    lastIndex = colorMatch.end
    processedIndices.add(colorMatch.start)
    processedIndices.add(colorMatch.end)
  }

  // Add remaining text
  if (lastIndex < content.length) {
    const remainingText = content.substring(lastIndex)
    parts.push(...parseFormattingInText(remainingText, currentFormat))
  }

  // If no color matches, parse normally
  if (colorMatches.length === 0) {
    return parseFormattingInText(content, currentFormat)
  }

  return parts
}

function parseFormattingInText(
  text: string,
  baseFormat: Partial<FormattedPart> = {}
): FormattedPart[] {
  const parts: FormattedPart[] = []
  let remaining = text
  let index = 0

  // Process in order: bold, italic, underline
  while (remaining.length > 0) {
    // Find earliest formatting mark
    type MatchType = {
      type: 'bold' | 'italic' | 'underline'
      start: number
      end: number
      content: string
    }
    let earliestMatch: MatchType | null = null

    // Check for bold
    const boldMatch = remaining.match(/\*([^*]+)\*/)
    if (boldMatch && boldMatch.index !== undefined) {
      const matchStart = boldMatch.index
      if (earliestMatch === null) {
        earliestMatch = {
          type: 'bold',
          start: matchStart,
          end: matchStart + boldMatch[0].length,
          content: boldMatch[1],
        }
      } else {
        // @ts-ignore - TypeScript control flow analysis limitation
        if (matchStart < earliestMatch.start) {
          // @ts-ignore
          earliestMatch = {
            type: 'bold',
            start: matchStart,
            end: matchStart + boldMatch[0].length,
            content: boldMatch[1],
          }
        }
      }
    }

    // Check for italic
    const italicMatch = remaining.match(/_([^_]+)_/)
    if (italicMatch && italicMatch.index !== undefined) {
      const matchStart = italicMatch.index
      if (earliestMatch === null) {
        earliestMatch = {
          type: 'italic',
          start: matchStart,
          end: matchStart + italicMatch[0].length,
          content: italicMatch[1],
        }
      } else {
        // @ts-ignore - TypeScript control flow analysis limitation
        if (matchStart < earliestMatch.start) {
          // @ts-ignore
          earliestMatch = {
            type: 'italic',
            start: matchStart,
            end: matchStart + italicMatch[0].length,
            content: italicMatch[1],
          }
        }
      }
    }

    // Check for underline
    const underlineMatch = remaining.match(/~([^~]+)~/)
    if (underlineMatch && underlineMatch.index !== undefined) {
      const matchStart = underlineMatch.index
      if (earliestMatch === null) {
        earliestMatch = {
          type: 'underline',
          start: matchStart,
          end: matchStart + underlineMatch[0].length,
          content: underlineMatch[1],
        }
      } else {
        // @ts-ignore - TypeScript control flow analysis limitation
        if (matchStart < earliestMatch.start) {
          // @ts-ignore
          earliestMatch = {
            type: 'underline',
            start: matchStart,
            end: matchStart + underlineMatch[0].length,
            content: underlineMatch[1],
          }
        }
      }
    }

    if (earliestMatch) {
      // Add text before the match
      if (earliestMatch.start > 0) {
        const beforeText = remaining.substring(0, earliestMatch.start)
        if (beforeText) {
          parts.push({ ...baseFormat, text: beforeText })
        }
      }

      // Add formatted text
      const format: Partial<FormattedPart> = { ...baseFormat }
      if (earliestMatch.type === 'bold') format.bold = true
      if (earliestMatch.type === 'italic') format.italic = true
      if (earliestMatch.type === 'underline') format.underline = true

      parts.push({
        ...format,
        text: earliestMatch.content,
      })

      // Continue with remaining text
      remaining = remaining.substring(earliestMatch.end)
    } else {
      // No more formatting, add remaining text
      if (remaining) {
        parts.push({ ...baseFormat, text: remaining })
      }
      break
    }
  }

  return parts.length > 0 ? parts : [{ ...baseFormat, text: remaining || text }]
}

