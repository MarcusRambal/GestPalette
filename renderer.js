console.log('renderer.js cargado correctamente')

document.addEventListener('DOMContentLoaded', async () => {
  const productsContainer = document.querySelector('.products-list')
  const selectedProductsTableBody = document.querySelector('.selected-products-table tbody')
  const amountPaidInput = document.getElementById('amount-paid')
  const changeReturn = document.getElementById('change-return')
  const calculateReturnButton = document.querySelector('.calculate-return-button')
  const payButtom = document.querySelector('.pay-button')
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
      const productId = `${product.name}_${product.type}_${product.price}`
      if (selectedProducts[productId]) {
        selectedProducts[productId].quantity += 1
      } else {
        selectedProducts[productId] = {
          ...product,
          id: productId,
          quantity: 1,
          discount: 0
        }
      }
      updateSelectedProductsTable()
    }

    // Actualizar tabla de productos seleccionados
    function updateSelectedProductsTable () {
      selectedProductsTableBody.innerHTML = ''
      // eslint-disable-next-line no-unused-vars
      let total = 0
      Object.values(selectedProducts).forEach(product => {
        const productTotal = product.quantity * product.price * ((100 - product.discount) / 100)
        total += productTotal

        const productRow = document.createElement('tr')
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
        selectedProductsTableBody.appendChild(productRow)
      })

      document.querySelectorAll('.discount-input').forEach(input => {
        input.addEventListener('input', handleDiscountChange)
      })
      document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('input', handleQuantityChange)
      })

      document.querySelectorAll('.delete-product').forEach(button => {
        button.addEventListener('click', handleDeleteProduct)
      })

      // Actualizar el total en la vista
      updateTotal()
    }

    function handleQuantityChange (event) {
      const input = event.target
      const productId = input.getAttribute('data-product-id')
      const quantity = parseInt(input.value) || 0
      const product = selectedProducts[productId]

      if (product) {
        product.quantity = quantity
        updateSelectedProductsTable()
      }
    }

    function handleDiscountChange (event) {
      const input = event.target
      const productId = input.getAttribute('data-product-id')
      const discount = Math.min(Math.max(parseFloat(input.value) || 0, 0), 100)
      const product = selectedProducts[productId]

      if (product) {
        product.discount = discount
        updateSelectedProductsTable()
      }
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

    payButtom.addEventListener('click', () => {
      const totalDisplay = document.querySelector('#total-display')
      const total = parseFloat(totalDisplay.textContent.replace('Total: $', '').replace(/,/g, '')) || 0
      const amountPaid = parseFloat(amountPaidInput.value) || 0

      if (amountPaid < total) {
        changeReturn.textContent = 'La cantidad dada por el cliente es menor que el total a pagar.'
        console.log('la cantidad paga es menor')
      }

      console.log('pago realizado con exito')

      // Implementar base de datos

      selectedProductsTableBody.innerHTML = ''
      amountPaidInput.value = ''
      changeReturn.textContent = 'Vuelto: $0.00'
      document.querySelector('#total-display').textContent = 'Total: $0.00'
      Object.keys(selectedProducts).forEach(key => delete selectedProducts[key])
    })
  } catch (error) {
    console.error('Error al cargar productos:', error)
  }
})

