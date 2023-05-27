export interface EmitteryOptions {
  debug: {
    enabled: boolean
  }
}

export type ProducerItem = [name: EventName, data: EventData]

export interface Producer {
  enqueue(item: EventData | Promise<ProducerItem>): void
  finish(): void
}
export interface ProducerIteratorReturn {
  next(): Promise<{ done: true } | { done: false; value: unknown }>
  return(value: unknown): Promise<{ done: true; value: unknown } | { done: true }>
  // [Symbol.iterator](): ProducerIteratorReturn
  [Symbol.asyncIterator](): ProducerIteratorReturn

}
export type EventName = PropertyKey
export type EventValue = Set<EventListener>
export type EventProducerValue = Set<Producer>
export type EventNames = readonly EventName[] | EventName
export type EventData = Record<string, any>
export type EventListener = (eventData: EventData) => void
export type AnyEventListener = (eventName: EventName, eventData: EventData) => void
export type AnyEventValue = Set<AnyEventListener>
export type EmitteryOncePromise<T> = {
  off(): void
} & Promise<T>
