const products = [
    { name: 'Kamish Fang Blade', price: 1000, img: 'assets/images/su/marketplace/ka.png' },
    { name: 'Shadow Monarch Cloak', price: 1200, img: 'assets/images/su/marketplace/shadow.png' },
    { name: 'Baruka’s Dagger', price: 800, img: 'assets/images/su/marketplace/ba.png' },
    { name: 'Elixir of Mana', price: 300, img: 'assets/images/su/marketplace/el.png' },
    { name: 'Igris Contract', price: 1500, img: 'assets/images/su/marketplace/igris.png' },
  ];

  const productGrid = document.getElementById('productGrid');
  const previewTitle = document.getElementById('previewTitle');
  const previewImg = document.getElementById('previewImg');
  const cartItems = document.getElementById('cartItems');
  const totalPrice = document.getElementById('totalPrice');

  let selectedProduct = null;
  let cart = [];

  products.forEach((p, index) => {
    const div = document.createElement('div');
    div.className = 'product';
    div.innerHTML = `
      <img src="${p.img}" />
      <span>${p.name}</span>
      <strong>$${p.price}</strong>
    `;
    //cursed ass for each  gpt :<
    div.onclick = () => {
      selectedProduct = p;
      previewTitle.innerText = p.name;
      previewImg.src = p.img;
    };
    productGrid.appendChild(div);
  });

  function addToCart() {
    if (!selectedProduct) return;
    cart.push(selectedProduct);
    updateCartUI();
  }

  function updateCartUI() {
    if (cart.length === 0) {
      cartItems.innerText = 'None';
      totalPrice.innerText = '$0.00';
    } else {
      cartItems.innerText = cart.map(p => p.name).join(', ');
      const total = cart.reduce((sum, item) => sum + item.price, 0);
      totalPrice.innerText = `$${total.toFixed(2)}`;
    }
  }