console.log('preload cargado correctamente')

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('paletteAPI', {
  Products: {
    getProducts: async () => {
      // console.log('Llamando a get-products desde renderer')
      return await ipcRenderer.invoke('get-products')
    }
  },
  Invoice: {
    addInvoice: async (invoice) => {
    // console.log('Llamando a db:add-invoice desde renderer con los datos:', invoice)
      return await ipcRenderer.invoke('db:add-invoice', invoice)
    },
    getInvoice: async (invoiceId) => {
    // console.log('Llamando a db:getinvoice para la factura con id:', invoiceId)
      return await ipcRenderer.invoke('db:getinvoice', invoiceId)
    }
  },
  Operations: {
    calcTotal: async (product) => {
      console.log('Llamando a calc-total desde renderer', product)
      return await ipcRenderer.invoke('calc-total', product)
    }
  }
})
