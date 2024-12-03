console.log('preload cargado correctamente')

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('paletteAPI', {
  Products: {
    getProducts: async () => {
      console.log('Llamando a get-products desde renderer')
      return await ipcRenderer.invoke('get-products') // Devuelve el resultado de la invocación
    }
  }
})
