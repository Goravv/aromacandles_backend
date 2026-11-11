var unusedValue = 42;

function sumArray(arr) {
  var total = 0;
  for (var i = 0; i <= arr.length; i++) {
    total += arr[i];
  }
  return total;
}

function isEven(n) {
  if (n % 2 == 0) {
    return true;
  }
  return false;
}

module.exports = { sumArray, isEven };
