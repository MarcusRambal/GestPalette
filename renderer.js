console.log('renderer.js cargado correctamente')

document.addEventListener('DOMContentLoaded', async () => {
  const productsContainer = document.querySelector('.products-list')
  const selectedProductsTableBody = document.querySelector('.selected-products-table tbody')
  const amountPaidInput = document.getElementById('amount-paid')
  const changeReturn = document.getElementById('change-return')
  const calculateReturnButton = document.querySelector('.calculate-return-button')
  const payButtom = document.querySelector('.pay-button')
  const radioButton = document.querySelectorAll('input[name="payment"]')
  const multipagoContainer = document.querySelector('.multipago-container')
  const multiefectivo = document.getElementById('amount-paid-efectivo')
  const multiother = document.getElementById('amount-paid-other')
  const selectedProducts = {}

  try {
    const { products } = await window.paletteAPI.Products.getProducts() // Extrae 'products'
    if (!products || products.length === 0) {
      console.log('No se encontraron productos en el archivo config.json.')
      return
    }

    function updateProductList (filteredProducts) {
      productsContainer.innerHTML = ''

      filteredProducts.forEach(product => {
        const productBlock = document.createElement('div')
        productBlock.classList.add('product-item')

        productBlock.innerHTML = `
          <img src="${product.image}" alt="${product.name}" class="product-image" />
          <h3>${product.name}</h3>
          <p class="price">$${product.price}</p>
          <button class="add-to-cart" data-product-id="${product.name}">+</button>
        `
        productBlock.querySelector('.add-to-cart').addEventListener('click', () => addProductToSelection(product))
        productsContainer.appendChild(productBlock)
      })
    }

    updateProductList(products)

    function addProductToSelection (product) {
      const productId = product.id
      if (selectedProducts[productId]) {
        selectedProducts[productId].quantity += 1
      } else {
        selectedProducts[productId] = {
          ...product,
          quantity: 1,
          discount: 0
        }
      }
      updateSelectedProductsTable()
    }

    // Actualizar tabla de productos seleccionados
    async function updateSelectedProductsTable () {
      const fragment = document.createDocumentFragment()
      const selectedProductsContainer = document.querySelector('.selected-products-container')
      // Ocultar contenedor durante la actualización
      selectedProductsContainer.classList.add('hidden')

      // Eliminar filas sin usar innerHTML
      while (selectedProductsTableBody.firstChild) {
        selectedProductsTableBody.removeChild(selectedProductsTableBody.firstChild)
      }

      for (const product of Object.values(selectedProducts)) {
        const productTotal = await window.paletteAPI.Operations.calcTotal(product)

        // Crear la fila
        const productRow = document.createElement('tr')
        productRow.classList.add('adding') // Clase de animación inicial

        productRow.innerHTML = `
          <td>${product.name}</td>
          <td>
            <input type="number" value="${product.quantity}" class="quantity-input" min="1" data-product-id="${product.id}">
          </td>
          <td>$${product.price.toLocaleString('es-CO')}</td>
          <td>
            <input type="number" value="${product.discount}" class="discount-input" min="0" max="100" data-product-id="${product.id}">
          </td>
          <td class="total-cell">$${productTotal.toLocaleString('es-CO')}</td>
          <td><button class="delete-product" data-product-id="${product.id}">Eliminar</button></td>
        `

        // Agregar eventos
        productRow.querySelector('.discount-input').addEventListener('input', handleDiscountChange)
        productRow.querySelector('.quantity-input').addEventListener('input', handleQuantityChange)
        productRow.querySelector('.delete-product').addEventListener('click', handleDeleteProduct)

        // Agregar la fila al fragmento
        fragment.appendChild(productRow)

        setTimeout(() => {
          productRow.classList.remove('adding')
          productRow.classList.add('added')
        }, 50)
      }

      // Agregar todo el fragmento al DOM de una sola vez
      selectedProductsTableBody.appendChild(fragment)

      // Mostrar el contenedor nuevamente
      /*  setTimeout(() => {
        selectedProductsContainer.classList.remove('hidden')
      }, 300)
      */
      // Actualizar el total
      updateTotal()
    }

    function handleQuantityChange (event) {
      const input = event.target
      const productId = input.getAttribute('data-product-id')
      const quantity = parseInt(input.value) || 0

      selectedProducts[productId].quantity = quantity
      updateSelectedProductsTable()
    }

    function handleDiscountChange (event) {
      const input = event.target
      const productId = input.getAttribute('data-product-id')
      const discount = Math.min(Math.max(parseFloat(input.value) || 0, 0), 100)

      selectedProducts[productId].discount = discount
      updateSelectedProductsTable()
    }

    function handleDeleteProduct (event) {
      const button = event.currentTarget
      const productId = button.getAttribute('data-product-id')

      delete selectedProducts[productId]

      updateSelectedProductsTable()
    }

    function updateReturn (total) {
      calculateReturnButton.addEventListener('click', () => {
        const amountPaid = parseFloat(amountPaidInput.value) || 0
        const change = amountPaid - total
        if (change >= 0) {
          changeReturn.textContent = `Vuelto: $${change.toLocaleString('es-CO')}`
        } else {
          changeReturn.textContent = 'La cantidad dada por el cliente es menor que el total a pagar!'
        }
      })
    }

    function updateTotal () {
      let total = 0

      document.querySelectorAll('.total-cell').forEach(cell => {
        const numericValue = parseFloat(cell.textContent.replace(/\$|,/g, '').replace(/\./g, ''))
        total += numericValue || 0
      })

      const totalDisplay = document.querySelector('#total-display')
      if (totalDisplay) {
        totalDisplay.textContent = `Total: $${total.toLocaleString('es-CO')}`
      }
      updateReturn(total)
    }

    function filterProducts () {
      const selectedCategories = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(input => input.value)

      const filteredProducts = products.filter(product => {
        return selectedCategories.length === 0 || selectedCategories.includes(product.type)
      })

      updateProductList(filteredProducts)
    }

    document.querySelectorAll('input[name="category"]').forEach(checkbox => {
      checkbox.addEventListener('change', filterProducts)
    })

    async function saveInvoice (invoice) {
      try {
        await window.paletteAPI.Invoice.addInvoice(invoice)
        console.log('Entre a (saveInvoice)', invoice)
      } catch (error) {
        console.error('Error al guardar la factura:', error)
      }
    }

    function calculateTotalFromProducts (selectedProducts) {
      return Object.values(selectedProducts).reduce((acc, product) => {
        return acc + (product.quantity * product.price * ((100 - product.discount) / 100))
      }, 0)
    }
    radioButton.forEach((rbutton) => {
      rbutton.addEventListener('change', (event) => {
        const selectedPayment = event.target.value
        if (selectedPayment === 'multipago') {
          multipagoContainer.style.display = 'block' // Mostrar
        } else {
          multipagoContainer.style.display = 'none' // Ocultar
        }
      })
    })

    /* multiefectivo.addEventListener('input', (event) => {
      console.log('Valor en efectivo: ', event.target.value)
    }) */

    /* multiother.addEventListener('input', (event) => {
      console.log('Valor en other:', event.target.value)
    }) */

    /* Validar que esto no se pueda dar sin antes tener valores y ademas agregar
    boton de confirmacion */

    payButtom.addEventListener('click', async () => {
      const total = calculateTotalFromProducts(selectedProducts)
      console.log(total)
      // cambiar el como se agarra el total ya que se puede modificar desde consola

      // Validar que estos campos no esten vacios
      const amoundPaidEfectivo = parseFloat(multiefectivo.value)
      // console.log(amoundPaidEfectivo)
      const amountPaidOther = parseFloat(multiother.value)
      // console.log(amountPaidOther)

      const pagos = [amoundPaidEfectivo, amountPaidOther]
      // console.log(pagos)

      const amountPaid = parseFloat(amountPaidInput.value) || 0
      const paymentMethods = document.querySelector('input[name="payment"]:checked')
      let paymentType = paymentMethods ? paymentMethods.value : 'efectivo'

      if (amountPaid < total) {
        changeReturn.textContent = 'La cantidad dada por el cliente es menor que el total a pagar.'
        console.log('la cantidad paga es menor')
      }

      if (!['efectivo', 'tarjeta', 'transferencia', 'multipago'].includes(paymentType)) {
        paymentType = 'efectivo' // Valor por defecto
      }

      // Implementar base de datos
      const invoice = {
        productos: Object.values(selectedProducts).map(product => ({
          nombre: product.name,
          cantidad: product.quantity,
          precio: product.price,
          descuento: product.discount,
          total: product.quantity * product.price * ((100 - product.discount) / 100)
        })),
        total: calculateTotalFromProducts(selectedProducts),
        tipoPago: paymentType,
        multipagos: paymentType === 'multipago' ? pagos : []
      }
      console.log(invoice.tipoPago)
      console.log(invoice.multipagos)
      try {
        await saveInvoice(invoice)
        console.log('saveInvoice genero la factura correctamente ', invoice)
      } catch (error) {
        console.log('Error al procesar el pago', error)
      }
      // reiniciar interfaz y objetos
      selectedProductsTableBody.innerHTML = ''
      amountPaidInput.value = ''
      multiefectivo.value = ''
      multiother.value = ''
      changeReturn.textContent = 'Vuelto: $0.00'
      document.querySelector('#total-display').textContent = 'Total: $0.00'
      Object.keys(selectedProducts).forEach(key => delete selectedProducts[key])
    })
  } catch (error) {
    console.error('Error al cargar productos:', error)
  }
})


