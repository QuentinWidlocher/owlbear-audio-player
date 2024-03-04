import { debounce } from '@solid-primitives/scheduled'
import { makePersisted } from '@solid-primitives/storage'
import { createSignal, For, onCleanup, onMount, Show } from 'solid-js'
import { createStore } from 'solid-js/store'
import YoutubePlayer from 'youtube-player'
import { YouTubePlayer } from 'youtube-player/dist/types'

const [players, setPlayer] = createSignal<Record<string, YouTubePlayer>>({})

function randomInt(max: number, min: number = 0) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function Playlist(props: { playlist: Playlist }) {
  const ref = <div class="fixed bottom-0 right-0"></div>
  const [yt, setYt] = createSignal<YouTubePlayer>()

  onMount(() => {
    setYt(YoutubePlayer(ref as HTMLElement, { width: 0, height: 0, host: 'https', playerVars: { autoplay: 1, loop: 1, listType: 'playlist', list: props.playlist.url } }))
    yt()!.setShuffle(props.playlist.shuffle ?? false).then(async () => yt()!.playVideoAt(randomInt((await yt()!.getPlaylist()).length)))

    if (props.playlist.autoplay) {
      setTimeout(() => yt()!.playVideo(), 1000)
    }

    setPlayer(p => ({ ...p, [props.playlist.id]: yt()! }))
  })

  onCleanup(() => {
    setPlayer(p => {
      yt()!.destroy()
      delete p[props.playlist.id]
      return p
    })
  })

  return ref
}

type Playlist = {
  id: string,
  title: string,
  playing?: boolean,
  url: string,
  loop: boolean,
  autoplay: boolean,
  shuffle: boolean,
}

function App() {
  const [playlists, setPlaylists] = makePersisted(createStore<Playlist[]>([]))

  const editPlaylist = debounce(<T extends keyof Playlist>(i: number, prop: T, value: Playlist[T]) => setPlaylists(i, prop, value), 1000)

  return (
    <main class="bg-base-200">
      <div class="card bg-base-100 h-full shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Audio Player</h2>
          <For each={playlists} fallback={null}>
            {(playlist, i) => <>
              <div class="navbar bg-base-200">
                <div class="flex-1">
                  <input type="text" value={playlist.title} onInput={e => editPlaylist(i(), 'title', e.currentTarget.value)} class="input w-full max-w-xs" />
                  <input type="text" value={playlist.url} onInput={e => editPlaylist(i(), 'url', e.currentTarget.value)} class="input w-full max-w-xs" />
                </div>
                <div class="flex-none">
                  <button class="btn btn-primary" onClick={() => players()[playlist.id]?.previousVideo()}>Previous</button>
                  <button class="btn btn-primary" onClick={() => setPlaylists(i(), 'playing', !playlist.playing)}>{playlist.playing ? 'Stop' : 'Play'}</button>
                  <button class="btn btn-primary" onClick={() => players()[playlist.id]?.nextVideo()}>Next</button>
                  <button class="btn btn-primary" onClick={() => setPlaylists(p => p.filter(p => p.id != playlist.id))}>Remove</button>
                </div>
              </div>
              <Show when={playlist.playing}><Playlist playlist={playlist} /></Show>
            </>}
          </For>
          <div class="card-actions">
            <form class="flex" onSubmit={e => {
              e.preventDefault()
              setPlaylists(p => [...p, {
                id: crypto.randomUUID(),
                autoplay: p.length === 0,
                loop: false,
                shuffle: false,
                title: 'New Playlist',
                url: e.currentTarget.url.value,
              }])
            }}>
              <input name="url" type="text" class="input input-bordered w-full" />
              <button class="btn btn-primary">Add playlist</button>
            </form>
          </div>
        </div>
      </div>

    </main>
  )
}

export default App
