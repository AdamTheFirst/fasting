// Pin the time zone so calendar and DST tests mean the same thing on every machine and in CI.
module.exports = () => {
  process.env.TZ = 'Europe/Istanbul';
};
