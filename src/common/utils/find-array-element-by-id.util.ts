export function findArrayElementById<T extends { id: string }>(
  array: T[],
  id: string,
) {
  return array.find(({ id: originId }) => originId === id);
}
