const orders = [
  { id: 1, date: "2026-06-24", client: "Mercado Sakura", product: "Plano Pro", channel: "Site", team: "Inside Sales", status: "pago", total: 2890, cost: 920 },
  { id: 2, date: "2026-06-23", client: "Clínica Vida", product: "Setup Premium", channel: "WhatsApp", team: "Parcerias", status: "pago", total: 4420, cost: 1510 },
  { id: 3, date: "2026-06-21", client: "Tech Norte", product: "API Plus", channel: "Site", team: "Enterprise", status: "pendente", total: 7800, cost: 2600 },
  { id: 4, date: "2026-06-19", client: "Loja Horizonte", product: "Consultoria", channel: "Indicação", team: "Enterprise", status: "pago", total: 6300, cost: 2100 },
  { id: 5, date: "2026-06-18", client: "Studio Pixel", product: "Plano Starter", channel: "Site", team: "Inside Sales", status: "cancelado", total: 990, cost: 330 },
  { id: 6, date: "2026-06-17", client: "Auto Prime", product: "Setup Premium", channel: "WhatsApp", team: "Parcerias", status: "pago", total: 5120, cost: 1780 },
  { id: 7, date: "2026-06-15", client: "Delta Foods", product: "Plano Pro", channel: "Site", team: "Inside Sales", status: "pago", total: 3190, cost: 990 },
  { id: 8, date: "2026-06-12", client: "Nova Escola", product: "API Plus", channel: "Indicação", team: "Enterprise", status: "pago", total: 8400, cost: 2800 },
  { id: 9, date: "2026-06-10", client: "Casa Verde", product: "Plano Starter", channel: "WhatsApp", team: "Inside Sales", status: "pago", total: 1290, cost: 410 },
  { id: 10, date: "2026-06-08", client: "Orion Lab", product: "Consultoria", channel: "Site", team: "Enterprise", status: "pendente", total: 5600, cost: 1900 },
  { id: 11, date: "2026-06-05", client: "Blue Fit", product: "Plano Pro", channel: "Indicação", team: "Parcerias", status: "pago", total: 3580, cost: 1040 },
  { id: 12, date: "2026-06-01", client: "Solaris Tech", product: "Setup Premium", channel: "Site", team: "Enterprise", status: "pago", total: 6890, cost: 2400 }
];

const goals = [
  { label: "Faturamento", current: 55870, target: 70000 },
  { label: "Novos clientes", current: 11, target: 18 },
  { label: "Margem bruta", current: 69, target: 72 },
  { label: "Conversão", current: 31, target: 35 }
];

const kpis = document.querySelector("#kpis");
const barChart = document.querySelector("#barChart");
const goalsContainer = document.querySelector("#goals");
const ordersTable = document.querySelector("#ordersTable");
const orderCount = document.querySelector("#orderCount");
const bestDay = document.querySelector("#bestDay");
const periodFilter = document.querySelector("#periodFilter");
const channelFilter = document.querySelector("#channelFilter");
const teamFilter = document.querySelector("#teamFilter");
const searchInput = document.querySelector("#searchInput");
const exportBtn = document.querySelector("#exportBtn");
const themeBtn = document.querySelector("#themeBtn");

function currency(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function percent(value) {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

function setupOptions() {
  const channels = [...new Set(orders.map((order) => order.channel))].sort();
  const teams = [...new Set(orders.map((order) => order.team))].sort();

  channelFilter.innerHTML += channels.map((channel) => `<option value="${channel}">${channel}</option>`).join("");
  teamFilter.innerHTML += teams.map((team) => `<option value="${team}">${team}</option>`).join("");
}

function getFilteredOrders() {
  const days = periodFilter.value;
  const channel = channelFilter.value;
  const team = teamFilter.value;
  const search = searchInput.value.trim().toLowerCase();
  const now = new Date("2026-06-25T12:00:00");

  return orders.filter((order) => {
    const orderDate = new Date(`${order.date}T12:00:00`);
    const diffDays = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24));
    const matchesPeriod = days === "all" || diffDays <= Number(days);
    const matchesChannel = channel === "all" || order.channel === channel;
    const matchesTeam = team === "all" || order.team === team;
    const matchesSearch = !search || `${order.client} ${order.product}`.toLowerCase().includes(search);
    return matchesPeriod && matchesChannel && matchesTeam && matchesSearch;
  });
}

function calculateMetrics(list) {
  const paid = list.filter((order) => order.status === "pago");
  const revenue = paid.reduce((sum, order) => sum + order.total, 0);
  const cost = paid.reduce((sum, order) => sum + order.cost, 0);
  const margin = revenue ? ((revenue - cost) / revenue) * 100 : 0;
  const averageTicket = paid.length ? revenue / paid.length : 0;
  const conversion = list.length ? (paid.length / list.length) * 100 : 0;

  return {
    revenue,
    margin,
    averageTicket,
    conversion,
    paidOrders: paid.length,
    totalOrders: list.length
  };
}

function renderKpis(list) {
  const metrics = calculateMetrics(list);
  const cards = [
    ["Faturamento", currency(metrics.revenue), "+12,4% vs mês anterior", "positive"],
    ["Ticket médio", currency(metrics.averageTicket), "+8,1% vs meta", "positive"],
    ["Margem bruta", percent(metrics.margin), metrics.margin >= 65 ? "Saudável" : "Atenção", metrics.margin >= 65 ? "positive" : "negative"],
    ["Conversão", percent(metrics.conversion), `${metrics.paidOrders}/${metrics.totalOrders} pedidos pagos`, "positive"]
  ];

  kpis.innerHTML = cards
    .map(([label, value, caption, tone]) => `
      <article class="kpi">
        <span>${label}</span>
        <strong>${value}</strong>
        <small class="${tone}">${caption}</small>
      </article>
    `)
    .join("");
}

function groupByDay(list) {
  const grouped = {};

  list
    .filter((order) => order.status === "pago")
    .forEach((order) => {
      grouped[order.date] = (grouped[order.date] || 0) + order.total;
    });

  return Object.entries(grouped)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, total]) => ({ date, total }));
}

function renderChart(list) {
  const data = groupByDay(list);
  const max = Math.max(...data.map((item) => item.total), 1);
  const top = data.reduce((best, item) => item.total > best.total ? item : best, { total: 0, date: "" });

  bestDay.textContent = top.date ? `Melhor dia: ${top.date.split("-").reverse().join("/")}` : "Sem vendas pagas";
  barChart.innerHTML = data
    .map((item) => {
      const height = Math.max((item.total / max) * 100, 8);
      const label = item.date.slice(5).replace("-", "/");
      return `
        <div class="bar" title="${currency(item.total)}">
          <span style="height: ${height}%"></span>
          <small>${label}</small>
        </div>
      `;
    })
    .join("");
}

function renderGoals() {
  goalsContainer.innerHTML = goals
    .map((goal) => {
      const progress = Math.min((goal.current / goal.target) * 100, 100);
      const unit = goal.label.includes("Faturamento") ? currency(goal.current) : goal.current;
      return `
        <article class="goal">
          <div class="goal-head">
            <strong>${goal.label}</strong>
            <span>${unit} / ${goal.label.includes("Faturamento") ? currency(goal.target) : goal.target}</span>
          </div>
          <div class="progress">
            <span style="width: ${progress}%"></span>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderOrders(list) {
  orderCount.textContent = `${list.length} pedido(s)`;
  ordersTable.innerHTML = list
    .map((order) => `
      <tr>
        <td>${order.client}</td>
        <td>${order.product}</td>
        <td>${order.channel}</td>
        <td>${order.team}</td>
        <td><span class="status ${order.status}">${order.status}</span></td>
        <td>${currency(order.total)}</td>
      </tr>
    `)
    .join("");
}

function exportCsv() {
  const rows = getFilteredOrders();
  const header = ["Cliente", "Produto", "Canal", "Equipe", "Status", "Total"];
  const content = [
    header.join(";"),
    ...rows.map((order) => [order.client, order.product, order.channel, order.team, order.status, order.total].join(";"))
  ].join("\n");

  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "pedidos-dashboard.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function render() {
  const list = getFilteredOrders();
  renderKpis(list);
  renderChart(list);
  renderGoals();
  renderOrders(list);
}

function setupTheme() {
  const savedTheme = localStorage.getItem("salespulse-theme");
  if (savedTheme === "light") document.body.classList.add("light");

  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("light");
    localStorage.setItem("salespulse-theme", document.body.classList.contains("light") ? "light" : "dark");
  });
}

[periodFilter, channelFilter, teamFilter, searchInput].forEach((field) => {
  field.addEventListener("input", render);
});

exportBtn.addEventListener("click", exportCsv);
setupOptions();
setupTheme();
render();
