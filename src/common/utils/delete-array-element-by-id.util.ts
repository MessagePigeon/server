export function deleteArrayElementById<T extends { id: string }>(
  array: T[],
  id: string,
) {
  const index = array.findIndex(({ id: originId }) => originId === id);
  array.splice(index, 1);
  return index !== -1;
}
