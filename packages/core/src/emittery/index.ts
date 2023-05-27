import type {
  AnyEventListener,
  AnyEventValue,
  EmitteryOncePromise,
  EmitteryOptions,
  EventData,
  EventListener, EventName,
  EventNames,
  EventProducerValue,
  EventValue,
  Producer, ProducerItem, ProducerIteratorReturn,
} from './types'

// 不关联eventName, 任何事件触发emit都会调用
export const anyMap = new WeakMap<Emittery, AnyEventValue>()
// 事件映射Map
export const eventsMap = new WeakMap<Emittery, Map<EventName, EventValue>>()
export const producersMap = new WeakMap<Emittery, Map<EventName, EventProducerValue>>()
// 任何生产者
const anyProducer = Symbol('anyProducer')
// 核心事件
const listenerAdded = Symbol('listenerAdded')
const listenerRemoved = Symbol('listenerRemoved')

const resolvedPromise = Promise.resolve()
const isMetaEvent = (eventName: EventName) => eventName === listenerAdded || eventName === listenerRemoved

// function emitMetaEvent(emi)
/**
 * 获取事件监听器
 * @param instance
 * @param eventName
 */
function getEventListeners(instance: Emittery, eventName: EventName): EventValue | undefined {
  const events = eventsMap.get(instance)!
  if (!events.has(eventName))
    return

  return events.get(eventName)
}

function getNamesArr(eventNames: EventNames): EventName[] {
  return Array.isArray(eventNames) ? eventNames : [eventNames]
}

function isPropertyKey(name: unknown) {
  return typeof name === 'string'
    || typeof name === 'symbol'
    || typeof name === 'number'
}

function assertEventNames(eventNames: EventNames) {
  for (const eventName of getNamesArr(eventNames)) {
    if (!isPropertyKey(eventName))
      throw new TypeError('`eventName` must be a string, symbol, or number')
  }
}

function getEventProducers(instance: Emittery, eventName: EventName) {
  const key = isPropertyKey(eventName) ? eventName : anyProducer
  const producers = producersMap.get(instance)
  if (!producers?.has(key))
    return

  return producers!.get(key)
}

/**
 *
 * @param instance
 * @param eventName
 * @param eventData
 */
function enqueueProducers(instance: Emittery, eventName: EventName, eventData: EventData) {
  const producers = producersMap.get(instance)
  if (producers?.has(eventName)) {
    for (const producer of producers!.get(eventName) || [])
      producer.enqueue(eventData)
  }
  if (producers?.has(anyProducer)) {
    const item = Promise.all([eventName, eventData])
    for (const producer of producers!.get(anyProducer) || [])
      producer.enqueue(item)
  }
}

function iterator(instance: Emittery, eventNames: EventNames): ProducerIteratorReturn {
  const _eventNames = getNamesArr(eventNames)
  let isFinished = false
  let flush: (value?: unknown) => void = () => {
  }
  let queue: (EventData | Promise<ProducerItem>)[] | undefined = []
  // 生产者队列
  const producer: Producer = {
    enqueue(item) {
      if (queue) {
        queue.push(item)
        flush()
      }
    },
    finish() {
      isFinished = true
      flush()
    },
  }

  for (const eventName of _eventNames) {
    let set = getEventProducers(instance, eventName)
    if (!set) {
      set = new Set()
      const producers = producersMap.get(instance)
      producers?.set(eventName, set)
    }
    set.add(producer)
  }

  return {
    async next() {
      if (!queue)
        return { done: true }

      if (queue.length === 0) {
        if (isFinished) {
          queue = undefined
          return this.next()
        }
        await new Promise((resolve) => {
          flush = resolve
        })
        return this.next()
      }
      return {
        done: false,
        value: await queue.shift(),
      }
    },
    async return(value) {
      queue = undefined
      // 遍历事件，删除
      for (const eventName of _eventNames) {
        const set = getEventProducers(instance, eventName)
        if (set) {
          set.delete(producer)
          if (set.size === 0) {
            const producers = producersMap.get(instance)
            producers?.delete(eventName)
          }
        }
      }
      flush()
      return arguments.length > 0
        ? {
            done: true,
            value: await value,
          }
        : { done: true }
    },
    // [Symbol.iterator]() {
    //   return this
    // },
    [Symbol.asyncIterator]() {
      return this
    },
  }
}

export class Emittery {
  debug

  constructor(options?: Partial<EmitteryOptions>) {
    anyMap.set(this, new Set())
    eventsMap.set(this, new Map())
    producersMap.set(this, new Map())
    producersMap.get(this)!.set(anyProducer, new Set())
    if (options)
      this.debug = options.debug
  }

  on(eventNames: EventNames, listener: EventListener) {
    assertEventNames(eventNames)
    const _eventNames = getNamesArr(eventNames)

    for (const eventName of _eventNames) {
      let set = getEventListeners(this, eventName)
      // 未找到监听的Set集合时设置初始值
      if (!set) {
        set = new Set()
        const events = eventsMap.get(this)!
        events.set(eventName, set)
      }
      // 添加监听
      set.add(listener)

      // TODO: 发送核心事件
    }
    return this.off.bind(this, eventNames, listener)
  }

  off(eventNames: EventNames, listener: EventListener) {
    assertEventNames(eventNames)
    const _eventNames = getNamesArr(eventNames)

    for (const eventName of _eventNames) {
      const set = getEventListeners(this, eventName)
      if (set) {
        set.delete(listener)
        // 为0时删除事件Set
        if (set.size === 0) {
          const events = eventsMap.get(this)
          events?.delete(eventName)
        }
      }
      // TODO: 发送核心事件
    }
  }

  onAny(listener: AnyEventListener) {
    anyMap.get(this)!.add(listener)
  }

  /**
   * 注册一次事件，调用后卸载
   * @param eventNames
   */
  once(eventNames: EventNames) {
    let _off = () => {
    }
    const promise: any = new Promise((resolve) => {
      _off = this.on(eventNames, (data) => {
        _off()
        resolve(data)
      })
    })
    promise.off = _off
    return promise as EmitteryOncePromise<any>
  }

  events(eventNames: EventNames) {
    assertEventNames(eventNames)
    return iterator(this, eventNames)
  }

  async emit(eventName: EventName, eventData: any) {
    if (isMetaEvent(eventName))
      throw new TypeError('`eventName` cannot be meta event `listenerAdded` or `listenerRemoved`')

    // 放事件到生产者
    enqueueProducers(this, eventName, eventData)

    const listeners = getEventListeners(this, eventName) ?? new Set()
    const anyListeners = anyMap.get(this) ?? new Set()
    const staticListeners = [...listeners]
    const staticAnyListeners = isMetaEvent(eventName) ? [] : [...anyListeners]

    await resolvedPromise
    await Promise.all([
      ...staticListeners.map(async (listener) => {
        if (listeners.has(listener))
          return listener(eventData)
      }),
      ...staticAnyListeners.map(async (listener) => {
        if (anyListeners.has(listener))
          return listener(eventName, eventData)
      }),
    ])
  }
}
