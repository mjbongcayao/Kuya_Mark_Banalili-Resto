const peso = n => '₱' + Number(n).toLocaleString('en-PH');
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let orders = [];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function load() {
  const email = sessionStorage.getItem('email');
  if (!email) return showLogin();
  if (!EMAIL_RE.test(email)) {
    sessionStorage.removeItem('email');
    return showLogin('Please enter a valid email, like name@gmail.com');
  }
  orders = JSON.parse(localStorage.getItem('orders') || '[]').reverse(); // newest first
  $('login').style.display = 'none';
  $('history').style.display = 'block';
  render();
}

function showLogin(msg) {
  $('history').style.display = 'none';
  $('login').style.display = 'flex';
  $('loginErr').textContent = msg || '';
  $('loginErr').style.display = msg ? 'block' : 'none';
}

function render() {
  const q = $('search').value.trim().toLowerCase();
  const list = orders.filter(o =>
    !q || [o.code, o.customer?.name, o.customer?.contact].join(' ').toLowerCase().includes(q));

  const today = new Date().toDateString();
  $('sCount').textContent = orders.length;
  $('sRevenue').textContent = peso(orders.reduce((s, o) => s + o.total, 0));
  $('sToday').textContent = orders.filter(o => new Date(o.placedAt).toDateString() === today).length;

  $('rows').innerHTML = list.length ? list.map(o => `
    <tr>
      <td><b>${esc(o.code)}</b></td>
      <td>${esc(new Date(o.placedAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }))}</td>
      <td>${esc(o.customer.name)}<br><small>${esc(o.customer.contact)}</small>
          ${o.customer.notes ? `<br><small><i>“${esc(o.customer.notes)}”</i></small>` : ''}</td>
      <td>${o.items.map(i => `${esc(i.qty)}× ${esc(i.name)}`).join('<br>')}</td>
      <td><span class="pill ${o.orderType === 'takeout' ? 'takeout' : ''}">${o.orderType === 'takeout' ? 'Take out' : 'Dine in'}</span></td>
      <td><b>${peso(o.total)}</b></td>
    </tr>`).join('')
    : '<tr><td colspan="6" style="text-align:center;opacity:.6;padding:30px">No orders yet.</td></tr>';
}

$('loginForm').addEventListener('submit', e => {
  e.preventDefault();
  sessionStorage.setItem('email', $('email').value.trim());
  $('email').value = '';
  load();
});
$('search').addEventListener('input', render);
$('refresh').onclick = load;
$('clear').onclick = () => {
  if (confirm('Delete ALL order history? This cannot be undone.')) {
    localStorage.removeItem('orders');
    load();
  }
};
$('logout').onclick = () => { sessionStorage.removeItem('email'); showLogin(); };

load();
