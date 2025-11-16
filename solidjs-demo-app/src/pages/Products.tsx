import { createSignal, For } from 'solid-js';
import { A } from '@solidjs/router';

interface Product {
  id: number;
  name: string;
  price: number;
}

export default function Products() {
  const [products, setProducts] = createSignal<Product[]>([
    { id: 1, name: 'Product A', price: 29.99 },
    { id: 2, name: 'Product B', price: 49.99 },
    { id: 3, name: 'Product C', price: 19.99 },
  ]);

  const [newProductName, setNewProductName] = createSignal('');
  const [newProductPrice, setNewProductPrice] = createSignal('');

  const addProduct = () => {
    const name = newProductName().trim();
    const price = parseFloat(newProductPrice());

    if (name && !isNaN(price)) {
      setProducts([
        ...products(),
        { id: products().length + 1, name, price },
      ]);
      setNewProductName('');
      setNewProductPrice('');
    }
  };

  return (
    <div class="page">
      <h1>Products</h1>
      <A href="/" class="back-link">← Back to Home</A>

      <div class="card">
        <h2>Product List</h2>
        <ul>
          <For each={products()}>
            {(product) => (
              <li>
                <strong>{product.name}</strong> - ${product.price.toFixed(2)}
              </li>
            )}
          </For>
        </ul>
      </div>

      <div class="card">
        <h2>Add New Product</h2>
        <div class="form">
          <input
            type="text"
            placeholder="Product Name"
            value={newProductName()}
            onInput={(e) => setNewProductName(e.currentTarget.value)}
            aria-label="Product Name"
          />
          <input
            type="number"
            placeholder="Price"
            value={newProductPrice()}
            onInput={(e) => setNewProductPrice(e.currentTarget.value)}
            aria-label="Product Price"
          />
          <button onclick={addProduct}>Add Product</button>
        </div>
      </div>
    </div>
  );
}
