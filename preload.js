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
      console.log(invoice)
      return await ipcRenderer.invoke('db:add-invoice', invoice)
    },
    getInvoice: async () => {
    // console.log('Llamando a db:getinvoice para la factura con id:', invoiceId)
      return await ipcRenderer.invoke('db:get-invoices')
    }
  },
  Operations: {
    calcTotal: async (product) => {
      console.log('Llamando a calc-total desde renderer', product)
      return await ipcRenderer.invoke('calc-total', product)
    }
  },

  Calls: {
    historyButton: async () => {
      // console.log('Llamando a history-button desde renderer')
      return await ipcRenderer.invoke('history-button')
    },

    detailButton: async (invoiceId) => {
      // console.log('Llamando a get-invoiceDetail desde renderer con id de:', invoiceId)
      return await ipcRenderer.invoke('get-invoiceDetail', invoiceId)
    }
  }
})
