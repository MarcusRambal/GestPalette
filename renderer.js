console.log('renderer.js cargado correctamente')

document.addEventListener('DOMContentLoaded', async () => {
  const productsContainer = document.querySelector('.products-list')
  const selectedProductsTableBody = document.querySelector('.selected-products-table tbody')
  const amountPaidInput = document.getElementById('amount-paid')
  const changeDisplay = document.getElementById('change-return')
  const calculateReturnButton = document.querySelector('.calculate-return-button')
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
      if (selectedProducts[product.name]) {
        selectedProducts[product.name].quantity += 1
      } else {
        selectedProducts[product.name] = {
          ...product,
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
          <input type="number" value="${product.quantity}" class="quantity-input" min="1" data-product-id="${product.name}">
         </td>
          <td>$${product.price.toFixed(2)}</td>
          <td>
          <input type="number" value="${product.discount}" class="discount-input" min="0" max="100" data-product-id="${product.name}">
          </td>
          <td class="total-cell">$${productTotal.toFixed(2)}</td>
          <td><button class="delete-product" data-product-id="${product.name}">Eliminar</button></td>
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
      const productName = input.getAttribute('data-product-id')
      const quantity = parseInt(input.value) || 0
      const product = selectedProducts[productName]

      if (product) {
        product.quantity = quantity
        updateSelectedProductsTable()
      }
    }

    function handleDiscountChange (event) {
      const input = event.target
      const productName = input.getAttribute('data-product-id')
      const discount = Math.min(Math.max(parseFloat(input.value) || 0, 0), 100)
      const product = selectedProducts[productName]

      if (product) {
        product.discount = discount
        updateSelectedProductsTable()
      }
    }

    function handleDeleteProduct (event) {
      const button = event.currentTarget
      const productName = button.getAttribute('data-product-id')

      delete selectedProducts[productName]

      updateSelectedProductsTable()
    }

    function updateReturn (total) {
      calculateReturnButton.addEventListener('click', () => {
        const amountPaid = parseFloat(amountPaidInput.value) || 0
        const change = amountPaid - total
        if (change >= 0) {
          changeDisplay.textContent = `Vuelto: $${change.toFixed(2)}`
        } else {
          changeDisplay.textContent = 'La cantidad dada por el cliente es menor que el total a pagar!'
        }
      })
    }

    function updateTotal () {
      let total = 0

      document.querySelectorAll('.total-cell').forEach(cell => {
        total += parseFloat(cell.textContent.replace('$', '')) || 0
      })

      const totalDisplay = document.querySelector('#total-display')
      if (totalDisplay) {
        totalDisplay.textContent = `Total: $${total.toFixed(2)}`
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
  } catch (error) {
    console.error('Error al cargar productos:', error)
  }
})

