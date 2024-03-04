/* @refresh reload */
import { render } from 'solid-js/web'

import './index.css'
import App from './App'
import OBR from '@owlbear-rodeo/sdk'

const root = document.getElementById('root')

if (import.meta.env.DEV) {
  render(() => <App role="GM" />, root!)
} else {
  OBR.onReady(async () => {
    const role = await OBR.player.getRole()
    render(() => <App role={role} />, root!)
  })
}

