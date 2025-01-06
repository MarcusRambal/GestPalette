const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const sqlite3 = require('sqlite3').verbose()
let products = []

const { initializeApp } = require('firebase/app')
const { getDatabase, ref, set } = require('firebase/database')

// Configuración de Firebase
const firebaseConfig = {
  // ---------------------- IMPORTANTE ----------------------
}

const firebaseApp = initializeApp(firebaseConfig)
const Firedb = getDatabase(firebaseApp)

// Configuración de la base de datos sqlite
const db = new sqlite3.Database(path.join(__dirname, 'Invoices.db'), (err) => {
  if (err) {
    console.log('Error al conectar con la base de datos:', err)
  } else {
    console.log('Base de datos conectada correctamente.')

    // Crear tabla de facturas
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS Invoices (
          id INTEGER PRIMARY KEY AUTOINCREMENT,       -- ID único de la factura
          payment_type TEXT NOT NULL,                 -- Tipo de pago (efectivo, tarjeta, etc.)
          total REAL NOT NULL,                        -- Total de la factura
          total_efectivo REAL NULL,
          total_tarjeta REAL NULL,
          created_at TEXT DEFAULT (datetime('now', 'localtime')), -- Fecha y hora de creación
          synced INTEGER DEFAULT 0                    -- Indica si la factura ha sido sincronizada con Firebase
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
          id INTEGER PRIMARY KEY AUTOINCREMENT,       -- ID único de los productos en la factura
          invoice_id INTEGER NOT NULL,                -- ID de la factura a la que pertenece este producto
          product_name TEXT NOT NULL,                 -- Nombre del producto
          quantity INTEGER NOT NULL,                  -- Cantidad del producto
          price REAL NOT NULL,                        -- Precio unitario del producto
          discount REAL NOT NULL DEFAULT 0,           -- Descuento aplicado al producto
          total REAL NOT NULL,                        -- Total para este producto (cantidad * precio * descuento)
          type TEXT NOT NULL,                         -- Tipo de producto 
          FOREIGN KEY (invoice_id) REFERENCES Invoices (id) -- Relación con la tabla Invoices
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

// Sincronizar facturas con Firebase
ipcMain.handle('syncFirebase', async () => {
  try {
    // Recuperar facturas no sincronizadas
    const invoices = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM Invoices WHERE synced = 0', [], (err, rows) => {
        if (err) reject(err)
        resolve(rows)
      })
    })

    for (const invoice of invoices) {
      try {
        const invoiceRef = ref(Firedb, `invoices/${invoice.id}`)
        // Sincronizar la factura
        await set(invoiceRef, {
          paymentType: invoice.payment_type,
          total: invoice.total,
          total_efectivo: invoice.total_efectivo,
          total_tarjeta: invoice.total_tarjeta,
          created_at: invoice.created_at
        })

        // Recuperar productos relacionados con la factura
        const invoiceItems = await new Promise((resolve, reject) => {
          db.all('SELECT * FROM InvoiceItems WHERE invoice_id = ?', [invoice.id], (err, rows) => {
            if (err) reject(err)
            resolve(rows)
          })
        })

        // Sincronizar cada producto de la factura
        for (const item of invoiceItems) {
          const itemRef = ref(Firedb, `invoices/${invoice.id}/items/${item.id}`)
          await set(itemRef, {
            productName: item.product_name,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount,
            total: item.total,
            type: item.type
          })
        }

        // Marcar la factura como sincronizada en SQLite db
        await new Promise((resolve, reject) => {
          db.run('UPDATE Invoices SET synced = 1 WHERE id = ?', [invoice.id], (err) => {
            if (err) reject(err)
            resolve()
          })
        })

        console.log(`Invoice ${invoice.id} y sus items sincronizados correctamente.`)
      } catch (error) {
        console.error(`Error al sincronizar la factura ${invoice.id}:`, error)
      }
    }
  } catch (err) {
    console.error('Error al recuperar las facturas desde SQLite:', err)
  }
})

// Función para agregar una factura y sus productos
ipcMain.handle('db:add-invoice', (event, invoice) => {
  // Insertar la factura en la tabla Invoices
  const { productos, total, tipoPago, multipagos } = invoice
  const [efectivo, tarjeta] = multipagos

  db.serialize(() => {
    // Insertar la factura
    db.run(`
      INSERT INTO Invoices (payment_type, total, total_efectivo, total_tarjeta)
      VALUES (?, ?, ?, ?)
    `, [tipoPago, total, efectivo, tarjeta], function (err) {
      if (err) {
        console.error('Error al insertar factura:', err)
        return
      }

      const invoiceId = this.lastID // Obtener el ID

      // Insertar los productos de la factura en la tabla InvoiceItems
      const stmt = db.prepare(`
        INSERT INTO InvoiceItems (invoice_id, product_name, quantity, price, discount, total, type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)

      productos.forEach(product => {
        stmt.run(
          invoiceId,
          product.nombre,
          product.cantidad,
          product.precio,
          product.descuento,
          product.total,
          product.tipo
        )
      })

      stmt.finalize()

      console.log('Factura insertada correctamente con ID:', invoiceId)
    })
  })
})

// Cargar productos al inicio
try {
  const data = fs.readFileSync(path.join(__dirname, '../config.json'), 'utf-8')
  products = JSON.parse(data)
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
  ipcMain.handle('calc-total', (event, product) => {
    const { quantity, price, discount } = product

    if (typeof quantity !== 'number' || typeof price !== 'number' || typeof discount !== 'number') {
      throw new Error('Los valores enviados son inválidos')
    }
    const total = quantity * price * ((100 - discount) / 100)
    return total
  })

  ipcMain.handle('history-button', async () => {
    try {
      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM Invoices  ORDER BY created_at DESC', [], (err, rows) => {
          if (err) {
            console.error('Error al obtener facturas:', err)
            reject(err)
            return
          }
          resolve(rows)
        })
      })
    } catch (error) {
      console.error('Error al manejar el history-button:', error)
      throw error
    }
  })
  // Obtener los productos de una factura
  ipcMain.handle('get-invoiceDetail', async (event, invoiceId) => {
    try {
      return new Promise((resolve, reject) => {
        // Obtener los productos asociados a la factura por su ID
        db.all('SELECT * FROM InvoiceItems WHERE invoice_id = ?', [invoiceId], (err, rows) => {
          if (err) {
            console.error('Error al obtener productos de la factura:', err)
            reject(err)
            return
          }
          resolve(rows) // Enviar los productos de la factura
        })
      })
    } catch (error) {
      console.error('Error al manejar el get-invoice-details:', error)
      throw error
    }
  })
  // Filtrar facturas por fecha
  ipcMain.handle('filter-by-date', async (event, date) => {
    try {
      if (!date) {
        throw new Error('Debe proporcionar una fecha para filtrar.')
      }

      return new Promise((resolve, reject) => {
        db.all(
          'SELECT * FROM Invoices WHERE DATE(created_at) = DATE(?) ORDER BY created_at DESC',
          [date],
          (err, rows) => {
            if (err) {
              console.error('Error al filtrar facturas por fecha:', err)
              reject(err)
              return
            }
            if (rows.length === 0) {
              console.log('No se encontraron facturas para la fecha:', date)
            }
            resolve(rows)
          }
        )
      })
    } catch (error) { console.error('Error al manejar el history-button:', error) }
  })
  // Obtener el balance diario o de una fecha especifica
  ipcMain.handle('daily-balance', async (event, date) => {
    try {
      if (!date) {
        throw new Error('Debe proporcionar un día para filtrar.')
      }

      return new Promise((resolve, reject) => {
        db.all(
          `
          SELECT 
            payment_type,
            SUM(total) AS total_ganado,
            SUM(total_efectivo) AS total_efectivo,
            SUM(total_tarjeta) AS total_tarjeta
          FROM Invoices
          WHERE DATE(created_at) = DATE(?)
          GROUP BY payment_type
          ORDER BY payment_type ASC
          `,
          [date],
          (err, rows) => {
            if (err) {
              console.error('Error al obtener el balance diario:', err)
              reject(err)
              return
            }
            if (rows.length === 0) {
              console.log('No se encontraron ventas para la fecha:', date)
              resolve([]) // Devolver un arreglo vacío si no hay ventas
            } else {
              const balance = {
                total_general: rows.reduce((sum, row) => sum + row.total_ganado, 0),
                desglose: rows.map(row => ({
                  tipo_pago: row.payment_type,
                  total: row.total_ganado,
                  efectivo: row.total_efectivo,
                  tarjeta: row.total_tarjeta
                }))
              }
              resolve(balance)
            }
          }
        )
      })
    } catch (error) {
      console.error('Error al manejar el history-button:', error)
    }
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
})





