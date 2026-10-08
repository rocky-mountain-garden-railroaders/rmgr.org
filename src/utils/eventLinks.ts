export const ignoreClickAfterSelection = (event: MouseEvent) => {
  const selection = window.getSelection()
  const card = event.currentTarget as Node
  if (selection && !selection.isCollapsed && selection.containsNode(card, true)) {
    event.preventDefault()
  }

}

const NON_MAPPABLE_LOCATIONS = /^(tbd|tba|tbc|online|virtual|zoom|remote|n\/?a|none)$/i

export const isMappableLocation = (location: string) => {
  const value = location.trim()
  return (
    value !== '' && !NON_MAPPABLE_LOCATIONS.test(value) && !/^[a-z][a-z\d+.-]*:\/\//i.test(value)
  )
}

export const openInMaps = (event: Event, location: string) => {
  event.preventDefault()
  event.stopPropagation()

  const selection = window.getSelection()
  if (event.type === 'click' && selection && !selection.isCollapsed) return

  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}
