import OBR from '@owlbear-rodeo/sdk'
import { debounce } from '@solid-primitives/scheduled'
import { makePersisted } from '@solid-primitives/storage'
import { createEffect, createSignal, For, onCleanup, onMount, Show } from 'solid-js'
import { createStore } from 'solid-js/store'
import YoutubePlayer from 'youtube-player'
import { YouTubePlayer } from 'youtube-player/dist/types'
import { ChevronLeft } from './icons/ChevronLeft'
import { Stop } from './icons/Stop'
import { PlayArrow } from './icons/PlayArrow'
import { ChevronRight } from './icons/ChevronRight'
import { DeleteForever } from './icons/DeleteForever'
import { PlaylistAdd } from './icons/PlaylistAdd'
import { OpenInNew } from './icons/OpenInNew'

const [players, setPlayer] = createSignal<Record<string, YouTubePlayer>>({})

// function randomInt(max: number, min: number = 0) {
//   return Math.floor(Math.random() * (max - min + 1) + min)
// }

function Playlist(props: { playlist: Playlist }) {
  const ref = <div class="fixed hidden bottom-0 right-0"></div>
  const [yt, setYt] = createSignal<YouTubePlayer>()

  onMount(() => {
    setYt(YoutubePlayer(ref as HTMLElement, { width: 0, height: 0, playerVars: { autoplay: 1, loop: 1, listType: 'playlist', list: props.playlist.url } }))
    // yt()!.setShuffle(props.playlist.shuffle ?? false).then(async () => yt()!.playVideoAt(randomInt((await yt()!.getPlaylist()).length)))

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

function App(props: { role: 'GM' | 'PLAYER' }) {
  const [playlists, setPlaylists] = makePersisted(createStore<Playlist[]>([]))

  const editPlaylist = debounce(<T extends keyof Playlist>(i: number, prop: T, value: Playlist[T]) => setPlaylists(i, prop, value), 1000)

  onMount(function subscribeToOBRMessages() {
    if (props.role == 'PLAYER') {
      OBR.broadcast.onMessage("com.widlocher.owlbear-audio-player/sync-playlist", ({ data }) => {
        const value = JSON.parse(data as string)
        console.log("[IN] com.widlocher.owlbear-audio-player/sync-playlist", value)
        setPlaylists(value)
      })
      OBR.broadcast.onMessage("com.widlocher.owlbear-audio-player/change-video", ({ data }) => {
        const value = JSON.parse(data as string)
        if (value.direction == 'next') {
          players()[value.id]?.nextVideo()
        } else {
          players()[value.id]?.previousVideo()
        }
      })

    }
  })

  createEffect(function sendSyncPlaylistMessage() {
    console.log("[OUT] com.widlocher.owlbear-audio-player/sync-playlist", JSON.stringify(playlists))
    if (props.role == 'GM') {
      OBR.broadcast.sendMessage("com.widlocher.owlbear-audio-player/sync-playlist", JSON.stringify(playlists))
    }
  });

  function changeVideo(id: string, direction: 'next' | 'previous') {
    players()[id]?.nextVideo()
    if (props.role == 'GM') {
      OBR.broadcast.sendMessage("com.widlocher.owlbear-audio-player/change-video", JSON.stringify({ direction, id }))
    }
  }

  return (
    <main class="h-screen bg-base-200">
      <div class="flex flex-col p-5 bg-base-100 h-full">
        <h2 class="text-xl font-bold mb-5">Audio Player</h2>
        <ol class="flex-1 flex flex-col gap-2">
          <For each={playlists} fallback={<li class="m-auto opacity-80">No playlist added</li>}>
            {(playlist, i) => <li>
              <div class="flex p-2 flex-nowrap gap-2 bg-base-200">
                <div class="flex-1 flex">
                  <a href={`https://www.youtube.com/playlist?list=${playlist.url}`} target="_blank" class="text-xl btn btn-square"><OpenInNew /></a>
                  <input type="text" value={playlist.title} onInput={e => editPlaylist(i(), 'title', e.currentTarget.value)} class="input w-full" />
                </div>
                <div class="flex-none join">
                  <button class="join-item text-xl btn btn-square btn-primary" onClick={() => changeVideo(playlist.id, 'previous')}><ChevronLeft /></button>
                  <button class="join-item text-xl btn btn-square btn-primary" onClick={() => setPlaylists(i(), 'playing', !playlist.playing)}>{playlist.playing ? <Stop /> : <PlayArrow />}</button>
                  <button class="join-item text-xl btn btn-square btn-primary" onClick={() => changeVideo(playlist.id, 'next')}><ChevronRight /></button>
                  <button class="join-item text-xl btn btn-square btn-outline btn-primary" onClick={() => setPlaylists(p => p.filter(p => p.id != playlist.id))}><DeleteForever /></button>
                </div>
              </div>
              <Show when={playlist.playing}><Playlist playlist={playlist} /></Show>
            </li>}
          </For>
        </ol>
        <div class="px-1 pt-5">
          <form class="join w-full" onSubmit={e => {
            try {

              e.preventDefault();
              const url: string = e.currentTarget.url.value;
              let id: string | undefined;

              if (url.includes('youtube.com/playlist')) {
                id = new URL(url).searchParams.get('list') ?? undefined
              } else if (url.includes('youtube.com/watch')) {
                throw new Error("Not a playlist")
              } else if (url.length == 34) {
                id = url
              }

              if (!id) {
                throw new Error("Invalid URL")
              }

              setPlaylists(p => [...p, {
                id: crypto.randomUUID(),
                autoplay: p.length === 0,
                loop: false,
                shuffle: false,
                title: 'New Playlist',
                url: id!,
              }]);

              e.currentTarget.reset();
            } catch (e) {
              if (e instanceof Error) {
                alert(e.message)
              }
            }
          }}>
            <input name="url" type="text" class="join-item input input-primary bg-base-200 w-full" />
            <button class="join-item btn btn-primary text-lg"><PlaylistAdd /> Add Youtube playlist</button>
          </form>
        </div>
      </div>

    </main>
  )
}

export default App
