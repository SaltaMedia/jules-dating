function weatherBucket(tempF) {
  if (tempF >= 75) return 'hot_75_95';
  if (tempF >= 55) return 'mild_55_75';
  return 'cool_<55';
}

module.exports = { weatherBucket };
