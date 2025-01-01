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
    },
    filterByDate: async (date) => {
      console.log('Llamando a filter-by-date desde renderer', date)
      return await ipcRenderer.invoke('filter-by-date', date)
    },
    filterByDay: async (day) => {
      console.log('Llamando a filter-by-day desde renderer', day)
      return await ipcRenderer.invoke('daily-balance', day)
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
  },

  Firebase: {
    syncInvoices: async () => {
      console.log('Llamando a syncFirebase desde renderer')
      return await ipcRenderer.invoke('syncFirebase')
    }
  }
})


