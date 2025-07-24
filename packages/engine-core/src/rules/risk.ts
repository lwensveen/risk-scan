function quickSelect(
  arr: number[],
  k: number,
  left = 0,
  right = arr.length - 1
): number {
  if (left === right) {
    return arr[left]!;
  }

  const pivotIndex = partition(arr, left, right);

  if (k === pivotIndex) {
    return arr[k]!;
  } else if (k < pivotIndex) {
    return quickSelect(arr, k, left, pivotIndex - 1);
  } else {
    return quickSelect(arr, k, pivotIndex + 1, right);
  }
}

function partition(arr: number[], left: number, right: number): number {
  const pivot = arr[right] as number;

  let i = left;

  for (let j = left; j < right; j++) {
    if ((arr[j] as number) <= pivot) {
      const temp = arr[i] as number;
      arr[i] = arr[j] as number;
      arr[j] = temp;
      i++;
    }
  }

  const temp = arr[i] as number;
  arr[i] = arr[right] as number;
  arr[right] = temp;

  return i;
}

export function calculateRiskMetrics(
  returns: number[],
  confidenceLevel: number
): { VaR: number; CVaR: number } {
  if (returns.length === 0 || confidenceLevel <= 0 || confidenceLevel >= 1) {
    throw new Error(
      'Invalid input: returns array must not be empty, and confidenceLevel must be between 0 and 1'
    );
  }

  const tempArray = [...returns];
  const index = Math.floor(returns.length * (1 - confidenceLevel));

  const VaR = quickSelect(tempArray, index);

  let sumTail = 0;
  let tailCount = 0;
  for (const ret of returns) {
    if (ret <= VaR) {
      sumTail += ret;
      tailCount++;
    }
  }
  const CVaR = tailCount > 0 ? sumTail / tailCount : VaR;

  return { VaR, CVaR };
}
