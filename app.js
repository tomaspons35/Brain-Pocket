const DEFAULT_TAGS = ["Personal"];

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let items = [];
let tags = [...DEFAULT_TAGS];
let todoFilter = "active"; // "active" | "completed" | "all"
let loadGen = 0;

const $ = (id) => document.getElementById(id);
const status = (msg) => { $("status").textContent = msg; };
const authStatus = (msg) => { $("auth-status").textContent = msg; };

// --- Auth ---
function showApp(signedIn) {
  $("login").hidden = signedIn;
  $("app").hidden = !signedIn;
}

// Reveal the app and load data. Called after a successful sign-in/up,
// and on page load if a session already exists.
function openApp() {
  authStatus("");
  showApp(true);
  render();        // default tags usable immediately, before data loads
  loadItems();
}

let authMode = "signin"; // "signin" | "signup"

function setAuthMode(mode) {
  authMode = mode;
  const signup = mode === "signup";
  $("auth-sub").textContent = signup ? "Create a new account." : "Sign in to your account.";
  $("auth-submit").textContent = signup ? "Create account" : "Sign in";
  $("auth-switch-text").textContent = signup ? "Already have an account?" : "Don't have an account?";
  $("auth-switch").textContent = signup ? "Sign in" : "Create one";
  $("auth-password").autocomplete = signup ? "new-password" : "current-password";
  authStatus("");
}

async function signIn(email, password) {
  authStatus("Signing in…");
  try {
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("signIn error:", error);
      return authStatus(
        error.status === 400 ? "Incorrect email or password." : error.message
      );
    }
    if (!data.session) return authStatus("Signed in but no session returned. Check your Supabase key.");
    openApp();
  } catch (err) {
    console.error("signIn threw:", err);
    authStatus("Error: " + (err.message || err));
  }
}

async function signUp(email, password) {
  const { data, error } = await db.auth.signUp({ email, password });
  if (error) {
    return authStatus(
      error.status === 422 ? "That email is already registered. Try signing in." : error.message
    );
  }
  // When confirmation is on, Supabase returns a user with no identities for an
  // already-registered email instead of an error. Treat that as "in use" too.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return authStatus("That email is already registered. Try signing in.");
  }
  // If sign-up returned a session, the user is already logged in (email
  // confirmation is off) — onAuthStateChange will open the app. Otherwise
  // confirmation is required and they must verify by email first.
  if (data.session) return openApp();
  authStatus("Account created. Check your email to confirm, then sign in.");
  setAuthMode("signin");
}

async function signOut() {
  await db.auth.signOut();
  items = [];
}

$("auth-form").onsubmit = (e) => {
  e.preventDefault();
  const email = $("auth-email").value.trim();
  const password = $("auth-password").value;
  authMode === "signup" ? signUp(email, password) : signIn(email, password);
};
$("auth-switch").onclick = () => setAuthMode(authMode === "signup" ? "signin" : "signup");
$("pw-toggle").onclick = () => {
  const input = $("auth-password");
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  $("pw-toggle").textContent = show ? "Hide" : "Show";
  $("pw-toggle").setAttribute("aria-label", show ? "Hide password" : "Show password");
};

// On page load, restore an existing session or show the login view.
db.auth.getSession().then(({ data }) => {
  data.session ? openApp() : showApp(false);
});

// Handle sign-out (and any external auth change) by returning to login.
db.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") showApp(false);
});

async function loadItems() {
  const gen = ++loadGen;
  const { data, error } = await db.from("items").select("*").order("created_at");
  if (gen !== loadGen) return;
  if (error) return status("Could not load data: " + error.message);
  items = data || [];
  const extra = items.map((i) => i.tag).filter((t) => t && !tags.includes(t));
  tags = [...tags, ...new Set(extra)];
  render();
}

function itemKind(item) {
  return (item.type || "").trim().toLowerCase();
}

async function addItem(text, type, tag) {
  const item = { text, type, tag, done: false, created_at: new Date().toISOString() };
  const { error } = await db.from("items").insert(item);
  if (error) return status("Could not save: " + error.message);
  status("");
  $("search").value = "";
  await loadItems();
  if (itemKind({ type }) === "note") {
    $("notes-title").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

async function updateItem(id, changes) {
  const { error } = await db.from("items").update(changes).eq("id", id);
  if (error) return status("Could not update: " + error.message);
  const item = items.find((i) => i.id === id);
  Object.assign(item, changes);
  render();
}

async function deleteItem(id) {
  const { error } = await db.from("items").delete().eq("id", id);
  if (error) return status("Could not delete: " + error.message);
  items = items.filter((i) => i.id !== id);
  render();
}

async function clearAll() {
  if (!confirm("Delete ALL todos and notes? This cannot be undone.")) return;
  const { error } = await db.from("items").delete().neq("id", 0);
  if (error) return status("Could not clear: " + error.message);
  items = [];
  render();
  status("All data cleared.");
}

function fillTagSelect() {
  $("add-tag").innerHTML = tags.map((t) => `<option value="${t}">${t}</option>`).join("");
}

function renderTagList() {
  $("tag-list").innerHTML = tags
    .map((t) => `<li>${t}<button data-tag="${t}" title="Delete tag">&times;</button></li>`)
    .join("");
}

function makeItem(item) {
  const li = document.createElement("li");
  li.className = "item" + (item.done ? " done" : "");

  const body = document.createElement("div");
  body.className = "body";
  const text = document.createElement("div");
  text.className = "text";
  text.textContent = item.text;
  body.appendChild(text);

  if (itemKind(item) === "todo") {
    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = item.done;
    check.setAttribute("aria-label", "Mark done");
    check.onchange = () => updateItem(item.id, { done: check.checked });
    li.appendChild(check);
  }

  li.appendChild(body);

  const actions = document.createElement("div");
  actions.className = "actions";

  const edit = document.createElement("button");
  edit.textContent = "✎";
  edit.title = "Edit";
  edit.onclick = () => startEdit(item, body, text);

  const del = document.createElement("button");
  del.textContent = "🗑";
  del.title = "Delete";
  del.onclick = () => deleteItem(item.id);

  actions.append(edit, del);
  li.appendChild(actions);
  return li;
}

function itemTime(item) {
  return item.created_at ? new Date(item.created_at).getTime() : 0;
}

function sortItems(list) {
  const byTime = (a, b) => itemTime(a) - itemTime(b);
  return [...list].sort((a, b) => {
    const tagA = (a.tag || "").trim();
    const tagB = (b.tag || "").trim();
    if (!tagA && tagB) return 1;
    if (tagA && !tagB) return -1;
    const tagCmp = tagA.localeCompare(tagB);
    return tagCmp !== 0 ? tagCmp : byTime(a, b);
  });
}

function groupByTag(list) {
  const groups = [];
  for (const item of list) {
    const tag = (item.tag || "").trim() || null;
    const last = groups[groups.length - 1];
    if (last && last.tag === tag) {
      last.items.push(item);
    } else {
      groups.push({ tag, label: tag || "Uncategorized", items: [item] });
    }
  }
  return groups;
}

function renderItemList(container, list) {
  container.innerHTML = "";
  if (list.length === 0) {
    container.className = "";
    return;
  }

  container.className = "item-groups";
  for (const group of groupByTag(list)) {
    const section = document.createElement("div");
    section.className = "item-group";
    const heading = document.createElement("h3");
    heading.className = "category-title";
    heading.textContent = group.label;
    section.appendChild(heading);
    const ul = document.createElement("ul");
    ul.className = "items";
    group.items.forEach((i) => ul.appendChild(makeItem(i)));
    section.appendChild(ul);
    container.appendChild(section);
  }
}

function startEdit(item, body, text) {
  const area = document.createElement("textarea");
  area.value = item.text;
  area.rows = 2;
  const save = document.createElement("button");
  save.textContent = "Save";
  save.onclick = () => updateItem(item.id, { text: area.value.trim() || item.text });
  body.replaceChild(area, text);
  body.appendChild(save);
  area.focus();
}

function render() {
  fillTagSelect();
  renderTagList();

  const q = $("search").value.trim().toLowerCase();
  const match = (i) =>
    !q || i.text.toLowerCase().includes(q) || (i.tag || "").toLowerCase().includes(q);

  const byFilter = (i) =>
    todoFilter === "all" || (todoFilter === "completed" ? i.done : !i.done);

  const todos = sortItems(items.filter((i) => itemKind(i) === "todo" && match(i) && byFilter(i)));
  const notes = sortItems(items.filter((i) => itemKind(i) === "note" && match(i)));

  renderItemList($("todo-list"), todos);
  renderItemList($("note-list"), notes);

  $("todo-empty").textContent =
    todoFilter === "completed" ? "No completed todos." :
    todoFilter === "active" ? "No active todos." : "No todos yet.";
  $("todo-empty").hidden = todos.length > 0;
  $("note-empty").hidden = notes.length > 0;
}

$("add-form").onsubmit = async (e) => {
  e.preventDefault();
  const text = $("add-text").value.trim();
  if (!text) return;
  const type = $("add-type").value;
  const tag = $("add-tag").value;
  $("add-text").value = "";
  await addItem(text, type, tag);
};

$("tag-form").onsubmit = (e) => {
  e.preventDefault();
  const name = $("new-tag").value.trim();
  if (name && !tags.includes(name)) {
    tags.push(name);
    $("new-tag").value = "";
    render();
  }
};

$("tag-list").onclick = async (e) => {
  const name = e.target.dataset.tag;
  if (!name) return;

  const inUse = items.filter((i) => i.tag === name);
  if (inUse.length) {
    const others = tags.filter((t) => t !== name);
    if (!others.length) {
      return status(`"${name}" is in use and is the only tag left.`);
    }
    const fallback = others.includes("Personal") ? "Personal" : others[0];
    const n = inUse.length;
    const msg = n === 1
      ? `"${name}" is used by 1 item. Reassign it to "${fallback}" and remove this tag?`
      : `"${name}" is used by ${n} items. Reassign them to "${fallback}" and remove this tag?`;
    if (!confirm(msg)) return;

    for (const item of inUse) {
      const { error } = await db.from("items").update({ tag: fallback }).eq("id", item.id);
      if (error) return status("Could not update: " + error.message);
      item.tag = fallback;
    }
  }

  tags = tags.filter((t) => t !== name);
  status("");
  render();
};

$("todo-filter").onclick = (e) => {
  const f = e.target.dataset.filter;
  if (!f) return;
  todoFilter = f;
  [...$("todo-filter").children].forEach((b) =>
    b.classList.toggle("active", b.dataset.filter === f)
  );
  render();
};

$("search").oninput = render;
$("clear-all").onclick = () => { $("menu").open = false; clearAll(); };
$("sign-out").onclick = () => { $("menu").open = false; signOut(); };
// loadItems() is triggered by onAuthStateChange once a session exists.
