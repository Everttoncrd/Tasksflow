const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

let csrfToken = null;


// =========================================================
// ERROS
// =========================================================

async function getErrorMessage(
  response,
  fallback
) {
  try {
    const data =
      await response.json();

    return (
      data.error ||
      fallback
    );
  } catch {
    return fallback;
  }
}


// =========================================================
// CSRF
// =========================================================

async function fetchCsrfToken() {
  const response =
    await fetch(
      `${API_URL}/auth/csrf`,
      {
        method: "GET",
        credentials: "include",
      }
    );

  if (!response.ok) {
    csrfToken = null;

    throw new Error(
      "Não foi possível validar a sessão."
    );
  }

  const data =
    await response.json();

  csrfToken =
    data.csrf_token;

  return csrfToken;
}


function requiresCsrf(method) {
  return ![
    "GET",
    "HEAD",
    "OPTIONS",
  ].includes(
    method.toUpperCase()
  );
}


// =========================================================
// FETCH CENTRAL
// =========================================================

async function apiFetch(
  path,
  options = {}
) {
  const method =
    (
      options.method ||
      "GET"
    ).toUpperCase();

  const isPublicAuthRoute =
    path === "/auth/login" ||
    path === "/auth/register";


  if (
    requiresCsrf(method) &&
    !isPublicAuthRoute &&
    !csrfToken
  ) {
    await fetchCsrfToken();
  }


  const headers = {
    ...(options.body
      ? {
          "Content-Type":
            "application/json",
        }
      : {}),

    ...(options.headers || {}),
  };


  if (
    requiresCsrf(method) &&
    !isPublicAuthRoute &&
    csrfToken
  ) {
    headers[
      "X-CSRF-Token"
    ] = csrfToken;
  }


  let response =
    await fetch(
      `${API_URL}${path}`,
      {
        ...options,
        method,
        credentials: "include",
        headers,
      }
    );


  // =======================================================
  // TENTA RENOVAR O CSRF UMA VEZ
  // =======================================================

  if (
    response.status === 403 &&
    !isPublicAuthRoute
  ) {
    csrfToken = null;

    try {
      await fetchCsrfToken();

      headers[
        "X-CSRF-Token"
      ] = csrfToken;

      response =
        await fetch(
          `${API_URL}${path}`,
          {
            ...options,
            method,
            credentials:
              "include",
            headers,
          }
        );
    } catch {
      // O erro será tratado abaixo.
    }
  }


  if (!response.ok) {
    const message =
      await getErrorMessage(
        response,
        "Erro ao comunicar com o servidor."
      );

    const error =
      new Error(message);

    error.status =
      response.status;

    throw error;
  }


  return response.json();
}


// =========================================================
// AUTENTICAÇÃO
// =========================================================

export async function registerUser(
  data
) {
  const result =
    await apiFetch(
      "/auth/register",
      {
        method: "POST",
        body:
          JSON.stringify(data),
      }
    );

  csrfToken = null;

  await fetchCsrfToken();

  return result;
}


export async function loginUser(
  data
) {
  const result =
    await apiFetch(
      "/auth/login",
      {
        method: "POST",
        body:
          JSON.stringify(data),
      }
    );

  csrfToken = null;

  await fetchCsrfToken();

  return result;
}


export async function logoutUser() {
  const result =
    await apiFetch(
      "/auth/logout",
      {
        method: "POST",
      }
    );

  csrfToken = null;

  return result;
}


export function getCurrentUser() {
  return apiFetch(
    "/auth/me"
  );
}


export function changePassword(
  data
) {
  return apiFetch(
    "/auth/change-password",
    {
      method: "PUT",

      body:
        JSON.stringify(data),
    }
  );
}


// =========================================================
// TAREFAS
// =========================================================

export function getTasks() {
  return apiFetch(
    "/tasks"
  );
}


export function getDashboard() {
  return apiFetch(
    "/dashboard"
  );
}


export function createTask(
  task
) {
  return apiFetch(
    "/tasks",
    {
      method: "POST",

      body:
        JSON.stringify(task),
    }
  );
}


export function updateTask(
  id,
  task
) {
  return apiFetch(
    `/tasks/${id}`,
    {
      method: "PUT",

      body:
        JSON.stringify(task),
    }
  );
}


export function updateTaskStatus(
  id,
  status
) {
  return apiFetch(
    `/tasks/${id}/status`,
    {
      method: "PUT",

      body:
        JSON.stringify({
          status,
        }),
    }
  );
}


export function deleteTask(
  id
) {
  return apiFetch(
    `/tasks/${id}`,
    {
      method: "DELETE",
    }
  );
}


// =========================================================
// CATEGORIAS
// =========================================================

export function getCategories() {
  return apiFetch(
    "/categories"
  );
}


export function createCategory(
  name
) {
  return apiFetch(
    "/categories",
    {
      method: "POST",

      body:
        JSON.stringify({
          name,
        }),
    }
  );
}


export function updateCategory(
  id,
  name
) {
  return apiFetch(
    `/categories/${id}`,
    {
      method: "PUT",

      body:
        JSON.stringify({
          name,
        }),
    }
  );
}


export function deleteCategory(
  id
) {
  return apiFetch(
    `/categories/${id}`,
    {
      method: "DELETE",
    }
  );
}