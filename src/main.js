const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const sqlite3 = require('sqlite3').verbose()
let products = []

// Configuración de la base de datos
const db = new sqlite3.Database(path.join(__dirname, 'Invoices.db'), (err) => {
  if (err) {
    console.log('Error al conectar con la base de datos:', err)
  } else {
    console.log('Base de datos conectada correctamente.')

    // Crear tabla de facturas
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS Invoices (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          payment_type TEXT NOT NULL,
          total REAL NOT NULL,
          created_at TEXT DEFAULT (datetime('now', 'localtime'))
        )
      `, (err) => {
        if (err) {
          console.log('Error al crear la tabla Invoices:', err)
        } else {
          console.log('Tabla "Invoices" creada o ya existe.')
        }
      })

      // Crear tabla de productos de la factura
      db.run(`
        CREATE TABLE IF NOT EXISTS InvoiceItems (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          invoice_id INTEGER NOT NULL,
          product_name TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          price REAL NOT NULL,
          discount REAL NOT NULL DEFAULT 0,
          total REAL NOT NULL,
          FOREIGN KEY (invoice_id) REFERENCES Invoices (id)
        )
      `, (err) => {
        if (err) {
          console.log('Error al crear la tabla InvoiceItems:', err)
        } else {
          console.log('Tabla "InvoiceItems" creada o ya existe.')
        }
      })
    })
  }
})

// funciones que trabajen con la base de datos

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
  // console.log('Productos enviados al renderer: ', products)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

