const API_URL = "http://127.0.0.1:5000";


// =========================================================
// FUNÇÃO AUXILIAR PARA LER ERROS DA API
// =========================================================

async function getErrorMessage(response, fallbackMessage) {
  try {
    const data = await response.json();

    return data.error || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}


// =========================================================
// LISTAR TAREFAS
// =========================================================

export async function getTasks() {
  const response = await fetch(
    `${API_URL}/tasks`
  );

  if (!response.ok) {
    throw new Error(
      "Erro ao carregar tarefas."
    );
  }

  return response.json();
}


// =========================================================
// DASHBOARD
// =========================================================

export async function getDashboard() {
  const response = await fetch(
    `${API_URL}/dashboard`
  );

  if (!response.ok) {
    throw new Error(
      "Erro ao carregar dashboard."
    );
  }

  return response.json();
}


// =========================================================
// CRIAR TAREFA
// =========================================================

export async function createTask(task) {
  const response = await fetch(
    `${API_URL}/tasks`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(task),
    }
  );

  if (!response.ok) {
    const message =
      await getErrorMessage(
        response,
        "Erro ao criar tarefa."
      );

    throw new Error(message);
  }

  return response.json();
}


// =========================================================
// ATUALIZAR TAREFA COMPLETA
// =========================================================

export async function updateTask(id, task) {
  const response = await fetch(
    `${API_URL}/tasks/${id}`,
    {
      method: "PUT",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(task),
    }
  );

  if (!response.ok) {
    const message =
      await getErrorMessage(
        response,
        "Erro ao atualizar tarefa."
      );

    throw new Error(message);
  }

  return response.json();
}


// =========================================================
// ATUALIZAR SOMENTE O STATUS
// =========================================================

export async function updateTaskStatus(
  id,
  status
) {
  const response = await fetch(
    `${API_URL}/tasks/${id}/status`,
    {
      method: "PUT",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        status: status,
      }),
    }
  );

  if (!response.ok) {
    const message =
      await getErrorMessage(
        response,
        "Erro ao atualizar status da tarefa."
      );

    throw new Error(message);
  }

  return response.json();
}


// =========================================================
// EXCLUIR TAREFA
// =========================================================

export async function deleteTask(id) {
  const response = await fetch(
    `${API_URL}/tasks/${id}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const message =
      await getErrorMessage(
        response,
        "Erro ao excluir tarefa."
      );

    throw new Error(message);
  }

  return response.json();
}


// =========================================================
// LISTAR CATEGORIAS
// =========================================================

export async function getCategories() {
  const response = await fetch(
    `${API_URL}/categories`
  );

  if (!response.ok) {
    const message =
      await getErrorMessage(
        response,
        "Erro ao carregar categorias."
      );

    throw new Error(message);
  }

  return response.json();
}


// =========================================================
// CRIAR CATEGORIA
// =========================================================

export async function createCategory(name) {
  const response = await fetch(
    `${API_URL}/categories`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        name: name,
      }),
    }
  );

  if (!response.ok) {
    const message =
      await getErrorMessage(
        response,
        "Erro ao criar categoria."
      );

    throw new Error(message);
  }

  return response.json();
}


// =========================================================
// EDITAR CATEGORIA
// =========================================================

export async function updateCategory(
  id,
  name
) {
  const response = await fetch(
    `${API_URL}/categories/${id}`,
    {
      method: "PUT",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        name: name,
      }),
    }
  );

  if (!response.ok) {
    const message =
      await getErrorMessage(
        response,
        "Erro ao atualizar categoria."
      );

    throw new Error(message);
  }

  return response.json();
}


// =========================================================
// EXCLUIR CATEGORIA
// =========================================================

export async function deleteCategory(id) {
  const response = await fetch(
    `${API_URL}/categories/${id}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const message =
      await getErrorMessage(
        response,
        "Erro ao excluir categoria."
      );

    throw new Error(message);
  }

  return response.json();
}