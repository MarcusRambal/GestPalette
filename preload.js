console.log('preload cargado correctamente')

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('paletteAPI', {
  Products: {
    addProduct: (product) => {
      console.log('Enviando producto al proceso principal...', product) // Verifica que el producto está siendo enviado
      ipcRenderer.send('add-product', product)
    },
    onProductAdded: (callback) => {
      ipcRenderer.on('product-added', callback)
    }
  }
})
