const peso = n => '₱' + Number(n).toLocaleString('en-PH');
const $ = id => document.getElementById(id);

const customer = JSON.parse(sessionStorage.getItem('customer') || 'null');
if (!customer) location.href = 'index.html';

const state = { menu: null, cat: null, cart: {}, type: 'dine-in' };

$('who').textContent = customer.name;
$('logout').onclick = () => { sessionStorage.removeItem('customer'); location.href = 'index.html'; };

/* ---- menu ---- */
function init() {
  state.menu = MENU;               // from js/menu.js
  state.cat = state.menu.categories[0].id;
  renderTabs();
  renderGrid();
  renderCart();
}

const allItems = () => state.menu.categories.flatMap(c => c.items);
const find = id => allItems().find(i => i.id === id);

function renderTabs() {
  $('tabs').innerHTML = '';
  state.menu.categories.forEach(c => {
    const b = document.createElement('button');
    b.className = 'tab' + (c.id === state.cat ? ' active' : '');
    b.textContent = c.name;
    b.onclick = () => { state.cat = c.id; renderTabs(); renderGrid(); };
    $('tabs').appendChild(b);
  });
}

function renderGrid() {
  const cat = state.menu.categories.find(c => c.id === state.cat);
  $('grid').innerHTML = '';
  cat.items.forEach(item => {
    const qty = state.cart[item.id] || 0;
    const el = document.createElement('div');
    el.className = 'item';
    el.innerHTML = `
      <img src="${item.img}" alt="${item.name}" loading="lazy">
      <div class="body">
        <h3>${item.name}</h3>
        <p class="desc">${item.desc}</p>
        <div class="row"><span class="price">${peso(item.price)}</span><span class="ctl"></span></div>
      </div>`;
    const ctl = el.querySelector('.ctl');
    if (qty === 0) {
      const add = document.createElement('button');
      add.className = 'add';
      add.textContent = 'Add';
      add.onclick = () => change(item.id, 1);
      ctl.appendChild(add);
    } else {
      ctl.appendChild(qtyControl(item.id, qty));
    }
    $('grid').appendChild(el);
  });
}

function qtyControl(id, qty) {
  const d = document.createElement('div');
  d.className = 'qty';
  d.innerHTML = `<button>−</button><span>${qty}</span><button>+</button>`;
  const [minus, plus] = d.querySelectorAll('button');
  minus.onclick = () => change(id, -1);
  plus.onclick = () => change(id, 1);
  return d;
}

/* ---- cart ---- */
function change(id, delta) {
  const next = (state.cart[id] || 0) + delta;
  if (next <= 0) delete state.cart[id]; else state.cart[id] = next;
  renderGrid();
  renderCart();
}

const total = () => Object.entries(state.cart).reduce((s, [id, q]) => s + find(id).price * q, 0);

function renderCart() {
  const list = $('cartList');
  const entries = Object.entries(state.cart);
  list.innerHTML = entries.length ? '' : '<div class="empty">Nothing yet — tap Add on a dish.</div>';
  entries.forEach(([id, qty]) => {
    const item = find(id);
    const row = document.createElement('div');
    row.className = 'cart-row';
    row.innerHTML = `<span>${item.name}</span>`;
    const right = document.createElement('span');
    right.style.display = 'flex';
    right.style.alignItems = 'center';
    right.style.gap = '10px';
    right.appendChild(qtyControl(id, qty));
    const price = document.createElement('b');
    price.textContent = peso(item.price * qty);
    right.appendChild(price);
    row.appendChild(right);
    list.appendChild(row);
  });
  $('total').textContent = peso(total());
  $('place').disabled = entries.length === 0;
}

document.querySelectorAll('.type button').forEach(b => {
  b.onclick = () => {
    state.type = b.dataset.type;
    document.querySelectorAll('.type button').forEach(x => x.classList.toggle('active', x === b));
  };
});

/* ---- place order (saved in this browser) ---- */
function makeCode(orders) {
  const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const pick = () => L[Math.floor(Math.random() * L.length)];
  const num = () => Math.floor(Math.random() * 10);
  let code;
  do { code = pick() + num() + num() + pick() + num(); } while (orders.some(o => o.code === code));
  return code;
}

$('place').onclick = () => {
  const items = Object.entries(state.cart).map(([id, qty]) => {
    const it = find(id);
    return { id, name: it.name, price: it.price, qty, lineTotal: it.price * qty };
  });
  const orders = JSON.parse(localStorage.getItem('orders') || '[]');
  const order = {
    code: makeCode(orders),
    customer: { ...customer, notes: $('notes').value.trim() },
    items,
    total: items.reduce((s, i) => s + i.lineTotal, 0),
    orderType: state.type,
    placedAt: new Date().toISOString()
  };
  orders.push(order);
  localStorage.setItem('orders', JSON.stringify(orders));

  $('code').textContent = order.code;
  $('doneMsg').textContent = `${state.type === 'dine-in' ? 'Dine in' : 'Take out'} · Total ${peso(order.total)}`;
  $('overlay').classList.add('show');
};

$('again').onclick = () => {
  state.cart = {};
  $('notes').value = '';
  $('overlay').classList.remove('show');
  renderGrid();
  renderCart();
};

init();
