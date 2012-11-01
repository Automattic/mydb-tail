
# mydb-tail

  Tails the oplog and emits operations. Formerly mydb-slave.

## How to use

```js
require('tail')({
  mongo: 'localhost:27017/local',
  redis: 'localhost:6379',
  ns: 'cloudup-development.*'
});
```

## API

### tailer(opts)

  Options are:
  - `mongo` mongo uri or instance pointing to the `local` database to tail
  - `redis` redis uri or instance
  - `ns` optionally, namespace to filter by (eg: `cloudup.*`)
  - `query` query to tail from
