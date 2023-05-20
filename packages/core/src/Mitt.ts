/*
 * simple event emitter
 */
class Mitt<MittEvent extends string = string, MittFunc extends (...args: any[]) => void = (...args: any[]) => void> {
  private list: Record<MittEvent, MittFunc[]> = {} as Record<MittEvent, MittFunc[]>

  on(event: MittEvent, fn: MittFunc) {
    if (!this.list[event])
      this.list[event] = []
    this.list[event].push(fn)
  }

  emit(event: MittEvent, ...args: any[]) {
    if (this.list[event]) {
      for (const fn of this.list[event])
        fn.apply(this, args)
    }
  }

  // 取消订阅
  off(event: MittEvent, fn: MittFunc) {
    if (this.list[event])
      this.list[event] = this.list[event].filter(f => f !== fn)
  }

  clear(event?: MittEvent) {
    if (event)
      this.list[event] = []
    else
      this.list = {} as Record<MittEvent, MittFunc[]>
  }
}
export default Mitt
