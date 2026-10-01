import { Component, type ReactNode } from 'react'
import { isChunkError, reloadForNewBuild } from '../engine/staleBuild'

/**
 * Catches a crash anywhere in a screen, so the player gets a way back
 * instead of a blank page. Keyed by the route, so moving on clears it.
 */
export class AppErrorBoundary extends Component<
  { children: ReactNode },
  { error?: Error }
> {
  state: { error?: Error } = {}

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('[app] screen crashed', error)
    if (isChunkError(error)) reloadForNewBuild()
  }

  render() {
    const err = this.state.error
    if (!err) return this.props.children
    const update = isChunkError(err)
    return (
      <div
        className='card center'
        style={{ margin: '40px auto', maxWidth: 420 }}
      >
        <div style={{ fontSize: '2.5rem' }} aria-hidden>
          {update ? '✨' : '💫'}
        </div>
        <h2>
          {update
            ? 'Updating to the newest version…'
            : 'Oops — that spell fizzled.'}
        </h2>
        <p className='muted'>
          {update
            ? 'A new version was released. Reload if it doesn’t refresh by itself.'
            : 'Something went wrong on this screen. Your progress is safe.'}
        </p>
        <div
          style={{
            display: 'flex',
            gap: 10,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <button
            type='button'
            className='btn btn-primary'
            onClick={() => {
              location.hash = '#/'
              this.setState({ error: undefined })
            }}
          >
            Back to the world
          </button>
          <button
            type='button'
            className='btn'
            onClick={() => location.reload()}
          >
            Reload
          </button>
        </div>
      </div>
    )
  }
}
