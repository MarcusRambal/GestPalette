console.log('renderer.js cargado correctamente')

document.addEventListener('DOMContentLoaded', () => {
  const addProductToggle = document.getElementById('add-product-toggle')
  const addProductForm = document.getElementById('add-product-form')
  const addProductBtn = document.getElementById('add-product-btn')
  const productNameInput = document.getElementById('product-name')
  const productPriceInput = document.getElementById('product-price')
  const productCostInput = document.getElementById('product-cost')
  const productsList = document.querySelector('.products-list') // Contenedor donde se mostrarán los productos

  // Mostrar/ocultar formulario
  addProductToggle.addEventListener('click', () => {
    addProductForm.style.display =
      addProductForm.style.display === 'none' ? 'block' : 'none'
  })

  addProductBtn.addEventListener('click', () => {
    const name = productNameInput.value.trim()
    const price = parseFloat(productPriceInput.value)
    const cost = parseFloat(productCostInput.value)

    // Validación básica
    if (!name || isNaN(price) || isNaN(cost)) {
      console.log('Por favor, completa todos los campos correctamente.')
      return
    }

    // Llamar a la API para enviar el producto al main process
    window.paletteAPI.Products.addProduct({ name, price, cost })

    // Limpiar campos después de añadir
    productNameInput.value = ''
    productPriceInput.value = ''
    productCostInput.value = ''
  })

  // Escuchar la respuesta del proceso principal
  window.paletteAPI.Products.onProductAdded((event, product) => {
    console.log('Producto añadido:', product)

    // Crear un nuevo elemento de producto y agregarlo a la lista
    const productElement = document.createElement('div')
    productElement.classList.add('product-item')
    productElement.innerHTML = `
     <div class="product-info">
      <h4>${product.name}</h4>
      <p>Precio: $${product.price.toFixed(2)}</p>
    </div>
  `
    productsList.appendChild(productElement)
  })
})
