import { JSX } from "solid-js/jsx-runtime";

export function PlayArrow(props: JSX.IntrinsicElements['svg']) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}><path fill="currentColor" d="M8 19V5l11 7z"></path></svg>
  )
}
