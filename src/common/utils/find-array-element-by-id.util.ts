export function findArrayElementById<T1 extends { id: T2 }, T2>(
  array: T1[],
  id: T2,
) {
  return array.find(({ id: originId }) => originId === id);
}
