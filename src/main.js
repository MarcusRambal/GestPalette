const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

let products = []

// Cargar productos al inicio
try {
  const data = fs.readFileSync(path.join(__dirname, '../config.json'), 'utf-8')
  products = JSON.parse(data)
  console.log('Productos cargados desde config.json:', products)
} catch (error) {
  console.error('Error al leer config.json:', error)
}

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

  // Enviar productos al renderer
  ipcMain.handle('get-products', () => products)
  //console.log('Productos enviados al renderer: ', products)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
