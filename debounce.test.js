const test = require('ava')
const debounce = require('./debounce')

test.cb('1 event, 1 call', t => {
  const func = debounce(() => t.pass(), 200)

  t.plan(1)
  setTimeout(() => func(), 100)

  setTimeout(t.end, 500)
})

test.cb('3 events, 1 call', t => {
  const func = debounce(() => t.pass(), 200)

  t.plan(1)
  setTimeout(() => func(), 100)
  setTimeout(() => func(), 120)
  setTimeout(() => func(), 140)

  setTimeout(t.end, 500)
})

test.cb('3 events, 2 calls', t => {
  const func = debounce(() => t.pass(), 200)

  t.plan(2)
  setTimeout(() => func(), 10)
  setTimeout(() => func(), 50)
  setTimeout(() => func(), 350)

  setTimeout(t.end, 800)
})

test.cb('3 events, end before first call', t => {
  const func = debounce(() => t.pass(), 200)

  t.plan(0)
  setTimeout(() => func(), 50)
  setTimeout(() => func(), 150)
  setTimeout(() => func(), 250)

  setTimeout(t.end, 300)
})

test.cb('1 event, 1 call with args', t => {
  const func = debounce(i => t.is(i, 1), 200)
  t.plan(1)

  setTimeout(() => func(1))

  setTimeout(t.end, 800)
})

test.cb('two different functions', t => {
  const func1 = debounce(i => t.is(i, 1), 200)
  const func2 = debounce(i => t.is(i, 2), 200)

  t.plan(3)
  // 1
  setTimeout(() => func1(1), 50)
  setTimeout(() => func1(1), 100)

  // 2
  setTimeout(() => func2(2), 100)

  // 3
  setTimeout(() => func1(1), 400)

  setTimeout(t.end, 800)
})
