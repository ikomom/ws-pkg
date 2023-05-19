import { Snapshots } from 'ik-typing-machine'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import example from '../../../example/main.js.typingmachine?raw'

export const snaps = reactive(Snapshots.fromString(example))
