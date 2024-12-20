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
          id INTEGER PRIMARY KEY AUTOINCREMENT,       -- ID único de la factura
          payment_type TEXT NOT NULL,                 -- Tipo de pago (efectivo, tarjeta, etc.)
          total REAL NOT NULL,                        -- Total de la factura
          total_efectivo REAL NULL,
          total_tarjeta REAL NULL,
          created_at TEXT DEFAULT (datetime('now', 'localtime')) -- Fecha y hora de creación
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

// funciones que trabajen con la base de datos
// Función para agregar una factura y sus productos
ipcMain.handle('db:add-invoice', (event, invoice) => {
  // Insertar la factura en la tabla Invoices
  console.log('PASADO DESDE LA API: ', invoice)
  const { productos, total, tipoPago, multipagos } = invoice
  // console.log('products: ', productos, 'total: ', total, 'tipo de pago: ', tipoPago, 'Multipago:', multipagos)
  const [efectivo, tarjeta] = multipagos
  console.log(efectivo, tarjeta)

  /* productos.forEach(product => {
    const productInConfig = products[product.nombre]
    console.log(productInConfig)
    if (!productInConfig) {
      throw new Error(`Producto ${product.nombre} no encontrado en el archivo config.json`)
    }
    if (product.precio !== productInConfig.price) {
      throw new Error(`El precio de ${product.nombre} ha sido manipulado`)
    }
    // Validar cantidad y descuento
    if (product.cantidad <= 0 || product.descuento < 0 || product.descuento > 100) {
      throw new Error(`Cantidad o descuento inválido para ${product.nombre}`)
    }
  }) */

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
        INSERT INTO InvoiceItems (invoice_id, product_name, quantity, price, discount, total)
        VALUES (?, ?, ?, ?, ?, ?)
      `)

      productos.forEach(product => {
        stmt.run(
          invoiceId,
          product.nombre,
          product.cantidad,
          product.precio,
          product.descuento,
          product.total
        )
      })

      stmt.finalize()

      console.log('Factura insertada correctamente con ID:', invoiceId)
    })
  })
})

/* ipcMain.handle('db:getinvoice', (event, invoiceId) => {
  db.serialize(() => {
    // Obtener la factura
    db.get(`
      SELECT * FROM Invoices WHERE id = ?
    `, [invoiceId], (err, invoice) => {
      if (err) {
        console.error('Error al obtener factura:', err)
        return
      }

      if (invoice) {
        // Obtener los productos de la factura
        db.all(`
          SELECT * FROM InvoiceItems WHERE invoice_id = ?
        `, [invoiceId], (err, items) => {
          if (err) {
            console.error('Error al obtener productos de la factura:', err)
            return
          }

          invoice.items = items // Añadir los productos a la factura
          event.reply('invoice-details', invoice) // Enviar la factura con los productos a historysubpage
        })
      } else {
        event.reply('invoice-details', null)
      }
    })
  })
}) */

// Cargar productos al inicio
try {
  const data = fs.readFileSync(path.join(__dirname, '../config.json'), 'utf-8')
  products = JSON.parse(data)
  console.log('Productos cargados desde config.json:', products)
  console.log(typeof (products))
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
  ipcMain.handle('calc-total', (event, product) => {
    const { quantity, price, discount } = product

    if (typeof quantity !== 'number' || typeof price !== 'number' || typeof discount !== 'number') {
      throw new Error('Los valores enviados son inválidos')
    }
    const total = quantity * price * ((100 - discount) / 100)
    console.log('total enviado desde el main:', quantity, price, discount)
    return total
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})


