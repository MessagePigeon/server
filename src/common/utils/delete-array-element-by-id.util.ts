export function deleteArrayElementById<T1 extends { id: T2 }, T2>(
  array: T1[],
  id: T2,
) {
  const index = array.findIndex(({ id: originId }) => originId === id);
  array.splice(index, 1);
  return index !== -1;
}
