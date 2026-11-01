// ScanRuler desktop shell: a window around the built web app. Everything is
// local; the only network use is a link you click, which opens in your browser.
const { app, BrowserWindow, shell, Menu } = require('electron')
const path = require('node:path')
const { start } = require('./staticServer.cjs')

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  let win
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  app.whenReady().then(async () => {
    Menu.setApplicationMenu(null)
    const { port } = await start(path.join(__dirname, 'app'))
    const origin = `http://127.0.0.1:${port}`
    win = new BrowserWindow({
      width: 1500,
      height: 950,
      backgroundColor: '#e7e6e1',
      title: 'ScanRuler',
      icon: path.join(__dirname, 'icon.png'),
      webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
    })
    win.webContents.setWindowOpenHandler(({ url }) => {
      if (/^https?:/i.test(url) && !url.startsWith(origin)) shell.openExternal(url)
      return { action: 'deny' }
    })
    win.webContents.on('will-navigate', (e, url) => {
      if (!url.startsWith(origin)) {
        e.preventDefault()
        if (/^https?:/i.test(url)) shell.openExternal(url)
      }
    })
    win.loadURL(origin)
  })

  app.on('window-all-closed', () => app.quit())
}
