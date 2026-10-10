export const ignoreClickAfterSelection = (event: MouseEvent) => {
  const selection = window.getSelection()
  const card = event.currentTarget as Node
  if (selection && !selection.isCollapsed && selection.containsNode(card, true)) {
    event.preventDefault()
  }
}
