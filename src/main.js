const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 800,

    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  win.loadFile('./src/index.html')
  win.webContents.openDevTools()
}

app.whenReady().then(() => {
  createWindow()

  ipcMain.on('add-product', (event, product) => {
    console.log('producto anadido', product)

    event.reply('product-added', product)
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
