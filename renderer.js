console.log('renderer.js cargado correctamente')

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Llamando a get-products desde renderer')

  const productsContainer = document.querySelector('.products-list')

  try {
    const { products } = await window.paletteAPI.Products.getProducts() // Extrae 'products'
    // console.log('Productos cargados:', products)

    if (!products || products.length === 0) {
      console.log('No se encontraron productos en el archivo config.json.')
      return
    }

    products.forEach(product => {
      const productBlock = document.createElement('div')
      productBlock.classList.add('product-item')
      productBlock.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="product-image" />
        <button class="add-to-cart" data-product-id="${product.name}">+</button>
      `
      productsContainer.appendChild(productBlock)
    })
  } catch (error) {
    console.error('Error al cargar productos:', error)
  }
})
