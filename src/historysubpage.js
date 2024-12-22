document.addEventListener('DOMContentLoaded', async () => {
  const historyButton = document.querySelector('.get-facturasButton')

  historyButton.addEventListener('click', async () => {
    try {
      const invoices = await window.paletteAPI.Calls.historyButton()
      console.log('Facturas obtenidas:', invoices)

      const invoicesList = document.querySelector('.invoices-list')
      invoicesList.innerHTML = ''

      invoices.forEach(invoice => {
        // Crear un div para cada factura y agregarla al contenedor
        const invoiceDiv = document.createElement('div')
        invoiceDiv.className = 'invoice'
        invoiceDiv.innerHTML = `
          <p><strong>ID:</strong> ${invoice.id}</p>
          <p><strong>Tipo de Pago:</strong> ${invoice.payment_type}</p>
          <p><strong>Total:</strong> $${invoice.total.toFixed(2)}</p>
          <p><strong>Efectivo:</strong> $${invoice.total_efectivo?.toFixed(2) || 'N/A'}</p>
          <p><strong>Tarjeta:</strong> $${invoice.total_tarjeta?.toFixed(2) || 'N/A'}</p>
          <p><strong>Fecha:</strong> ${invoice.created_at}</p>
          <button class="view-details" data-id="${invoice.id}">Ver Detalles</button>
        `
        invoicesList.appendChild(invoiceDiv)
      })

      // Agregar evento a los botones de "Ver Detalles"
      document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', async (event) => {
          const invoiceId = event.target.dataset.id
          console.log('Mostrar detalles de la factura con ID:', invoiceId)
          const invoiceDetails = await window.paletteAPI.Calls.detailButton(invoiceId)
          showInvoiceDetails(invoiceDetails)
        })
      })
    } catch (error) {
      console.error('Error al obtener las facturas:', error)
    }
  })

  // Función para mostrar los detalles de la factura
  function showInvoiceDetails (details) {
    const detailsContainer = document.querySelector('.invoice-details-container') // Crear o seleccionar un contenedor para mostrar los detalles
    detailsContainer.innerHTML = '' // Limpiar el contenedor

    details.forEach(item => {
      const itemDiv = document.createElement('div')
      itemDiv.className = 'invoice-item'
      itemDiv.innerHTML = `
         <p><strong>Factura con ID:</strong> ${item.invoice_id}</p>
        <p><strong>Producto:</strong> ${item.product_name}</p>
        <p><strong>Cantidad:</strong> ${item.quantity}</p>
        <p><strong>Precio:</strong> $${item.price.toFixed(2)}</p>
        <p><strong>Descuento:</strong> ${item.discount}%</p>
        <p><strong>Total:</strong> $${item.total.toFixed(2)}</p>
      `
      detailsContainer.appendChild(itemDiv)
    })
  }
})
