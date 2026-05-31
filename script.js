const KEY = "petshop_pet_da_mata_v2";

let data = JSON.parse(localStorage.getItem(KEY)) || [];
let editing = null;

const $ = (id) => document.getElementById(id);

const form = $("form");
const listWrap = $("listWrap");
const q = $("q");
const modePill = $("modePill");
const countPill = $("countPill");
const totalPets = $("totalPets");
const todayPets = $("todayPets");
const readyPets = $("readyPets");

const detailsPanel = $("detailsPanel");
const detailsTitle = $("detailsTitle");
const detailsBody = $("detailsBody");
const closeDetails = $("closeDetails");

const pet_nome = $("pet_nome");
const pet_raca = $("pet_raca");
const pet_idade = $("pet_idade");
const pet_sexo = $("pet_sexo");
const pet_peso = $("pet_peso");
const pet_tipo = $("pet_tipo");

const atendimento_servico = $("atendimento_servico");
const atendimento_status = $("atendimento_status");
const atendimento_data = $("atendimento_data");

const dono_nome = $("dono_nome");
const dono_tel = $("dono_tel");
const dono_obs = $("dono_obs");

function save() {
  localStorage.setItem(KEY, JSON.stringify(data));
}

function setMode() {
  modePill.textContent = editing ? "Modo: Editar" : "Modo: Novo";
}

function normalize(v) {
  return String(v ?? "").trim().toLowerCase();
}

function getPetIcon(tipo) {
  const t = normalize(tipo);
  if (t.includes("gato")) return "🐱";
  if (t.includes("coelho")) return "🐰";
  if (t.includes("pássaro") || t.includes("passaro")) return "🦜";
  if (t.includes("peixe")) return "🐠";
  if (t.includes("hamster") || t.includes("rato")) return "🐹";
  if (t.includes("outro")) return "🐾";
  return "🐶";
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));
}

function formatDate(date) {
  if (!date) return "-";
  const [year, month, day] = String(date).split("-");
  if (!year || !month || !day) return date;
  return `${day}/${month}/${year}`;
}

function getService(item) {
  return item?.atendimento?.servico || "Atendimento";
}

function getStatus(item) {
  return item?.atendimento?.status || "Aguardando";
}

function isToday(isoDate) {
  if (!isoDate) return false;
  const today = new Date().toISOString().slice(0, 10);
  return isoDate === today;
}

function matchesSearch(item, query) {
  const qq = normalize(query);
  if (!qq) return true;

  const bag = [
    item?.pet?.nome,
    item?.pet?.raca,
    item?.pet?.tipo,
    item?.pet?.idade,
    item?.pet?.sexo,
    item?.pet?.peso,
    item?.dono?.nome,
    item?.dono?.telefone,
    item?.dono?.obs,
    item?.atendimento?.servico,
    item?.atendimento?.status,
    item?.atendimento?.data
  ].filter(Boolean).join(" ");

  return normalize(bag).includes(qq);
}

function kv(k, v) {
  return `
    <div class="kv">
      <div class="k">${escapeHtml(k)}</div>
      <div class="v">${escapeHtml(v)}</div>
    </div>
  `;
}

function updateStats() {
  totalPets.textContent = String(data.length);
  todayPets.textContent = String(data.filter((item) => isToday(item?.atendimento?.data)).length);
  readyPets.textContent = String(data.filter((item) => getStatus(item) === "Pronto").length);
}

function closeDetailsPanel() {
  detailsPanel.classList.add("hidden");
  detailsTitle.textContent = "Detalhes";
  detailsBody.innerHTML = "";
}

function openDetailsPanel(item) {
  detailsPanel.classList.remove("hidden");
  const icon = getPetIcon(item.pet.tipo);
  detailsTitle.textContent = `${icon} Ficha: ${item.pet.nome}`;

  detailsBody.innerHTML = `
    ${kv("Serviço", getService(item))}
    ${kv("Status", getStatus(item))}
    ${kv("Próxima visita", formatDate(item?.atendimento?.data))}
    <div class="divider"></div>
    ${kv("Nome do pet", item.pet.nome)}
    ${kv("Tipo", item.pet.tipo || "-")}
    ${kv("Raça", item.pet.raca || "-")}
    ${kv("Idade", item.pet.idade || "-")}
    ${kv("Sexo", item.pet.sexo || "-")}
    ${kv("Peso (kg)", item.pet.peso || "-")}
    <div class="divider"></div>
    ${kv("Dono", item.dono.nome)}
    ${kv("Telefone", item.dono.telefone)}
    ${kv("Obs.", item.dono.obs || "-")}
    <div class="divider"></div>
    ${kv("Criado em", item.meta?.createdAt ? new Date(item.meta.createdAt).toLocaleString("pt-BR") : "-")}
    ${kv("Atualizado em", item.meta?.updatedAt ? new Date(item.meta.updatedAt).toLocaleString("pt-BR") : "-")}
  `;

  detailsPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function render() {
  const filtered = data.filter((d) => matchesSearch(d, q.value));
  countPill.textContent = String(filtered.length);
  updateStats();

  if (filtered.length === 0) {
    listWrap.innerHTML = `<div class="empty">Nenhum atendimento encontrado 🐾</div>`;
    closeDetailsPanel();
    return;
  }

  listWrap.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Pet</th>
          <th>Cliente</th>
          <th>Serviço</th>
          <th style="width:150px">Ações</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map((d) => {
          const icon = getPetIcon(d.pet.tipo);
          const service = getService(d);
          const status = getStatus(d);

          return `
            <tr>
              <td>
                <span class="linkName" data-act="details" data-id="${d.id}">
                  ${icon} ${escapeHtml(d.pet.nome)}
                </span>
                <div class="mini">
                  <strong>${escapeHtml(d.pet.raca)}</strong><br>
                  ${escapeHtml(d.pet.tipo || "-")}
                  ${d.pet.idade ? ` • ${escapeHtml(d.pet.idade)}a` : ""}
                  ${d.pet.peso ? ` • ${escapeHtml(d.pet.peso)}kg` : ""}
                </div>
              </td>

              <td>
                ${escapeHtml(d.dono.nome)}
                <div class="mini">${escapeHtml(d.dono.telefone)}</div>
              </td>

              <td>
                <span class="serviceTag">${escapeHtml(service)}</span>
                <div class="mini">
                  <span class="statusTag" data-status="${escapeHtml(status)}">${escapeHtml(status)}</span>
                  ${d?.atendimento?.data ? `<br>Próxima: ${escapeHtml(formatDate(d.atendimento.data))}` : ""}
                </div>
              </td>

              <td class="actionsCell">
                <button class="btn btn--soft btn--sm" data-act="edit" data-id="${d.id}" title="Editar registro">Editar</button>
                <button class="btn btn--danger btn--sm" data-act="del" data-id="${d.id}" title="Excluir registro">Excluir</button>
              </td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}

function edit(id) {
  const d = data.find((x) => x.id === id);
  if (!d) return;

  editing = id;

  pet_nome.value = d.pet.nome;
  pet_raca.value = d.pet.raca;
  pet_idade.value = d.pet.idade || "";
  pet_sexo.value = d.pet.sexo || "";
  pet_peso.value = d.pet.peso || "";
  pet_tipo.value = d.pet.tipo || "";

  atendimento_servico.value = d?.atendimento?.servico || "";
  atendimento_status.value = d?.atendimento?.status || "Aguardando";
  atendimento_data.value = d?.atendimento?.data || "";

  dono_nome.value = d.dono.nome;
  dono_tel.value = d.dono.telefone;
  dono_obs.value = d.dono.obs || "";

  setMode();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function delItem(id) {
  if (!confirm("Excluir este registro?")) return;

  data = data.filter((x) => x.id !== id);
  save();
  render();

  if (editing === id) {
    editing = null;
    form.reset();
    atendimento_status.value = "Aguardando";
    setMode();
  }

  closeDetailsPanel();
}

function buildObj() {
  const now = new Date().toISOString();

  return {
    id: editing || (crypto?.randomUUID ? crypto.randomUUID() : Date.now().toString()),
    pet: {
      nome: pet_nome.value.trim(),
      raca: pet_raca.value.trim(),
      idade: pet_idade.value.trim(),
      sexo: pet_sexo.value.trim(),
      peso: pet_peso.value.trim(),
      tipo: pet_tipo.value.trim()
    },
    atendimento: {
      servico: atendimento_servico.value.trim(),
      status: atendimento_status.value.trim() || "Aguardando",
      data: atendimento_data.value
    },
    dono: {
      nome: dono_nome.value.trim(),
      telefone: dono_tel.value.trim(),
      obs: dono_obs.value.trim()
    },
    meta: {
      createdAt: editing ? (data.find((x) => x.id === editing)?.meta?.createdAt || now) : now,
      updatedAt: now
    }
  };
}

function validate(obj) {
  if (!obj.pet.nome || !obj.pet.raca || !obj.dono.nome || !obj.dono.telefone) {
    alert("Preencha: nome do pet, raça, nome do dono e telefone.");
    return false;
  }
  return true;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const obj = buildObj();
  if (!validate(obj)) return;

  if (editing) {
    const i = data.findIndex((x) => x.id === editing);
    if (i >= 0) data[i] = obj;
    editing = null;
  } else {
    data.unshift(obj);
  }

  save();
  form.reset();
  atendimento_status.value = "Aguardando";
  setMode();
  closeDetailsPanel();
  render();
});

$("cancelBtn").addEventListener("click", () => {
  editing = null;
  form.reset();
  atendimento_status.value = "Aguardando";
  setMode();
});

q.addEventListener("input", render);

listWrap.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]");
  if (!el) return;

  const id = el.getAttribute("data-id");
  const act = el.getAttribute("data-act");
  const item = data.find((x) => x.id === id);

  if (act === "edit") edit(id);
  if (act === "del") delItem(id);
  if (act === "details" && item) openDetailsPanel(item);
});

closeDetails.addEventListener("click", closeDetailsPanel);

$("exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "petshop-backup.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

$("importInput").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const arr = JSON.parse(text);
    if (!Array.isArray(arr)) throw new Error("JSON inválido.");
    data = arr;
    save();
    render();
    closeDetailsPanel();
    alert("Importado com sucesso!");
  } catch (err) {
    alert("Erro ao importar: " + (err?.message || "arquivo inválido"));
  } finally {
    e.target.value = "";
  }
});

$("wipeBtn").addEventListener("click", () => {
  if (!confirm("Tem certeza? Isso apaga tudo do navegador.")) return;
  data = [];
  save();
  render();
  closeDetailsPanel();
});

setMode();
atendimento_status.value = "Aguardando";
render();
