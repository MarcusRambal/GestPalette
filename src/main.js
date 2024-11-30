const { app, BrowserWindow } = require('electron')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 800
  })

  win.loadFile('./src/index.html')
}

app.whenReady().then(() => {
  createWindow()
})
