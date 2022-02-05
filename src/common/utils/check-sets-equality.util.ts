export function checkSetsEquality<T>(set1: Set<T>, set2: Set<T>) {
  if (set1.size !== set2.size) {
    return false;
  }
  set1.forEach((element1) => {
    if (!set2.has(element1)) {
      return false;
    }
  });
  return true;
}
