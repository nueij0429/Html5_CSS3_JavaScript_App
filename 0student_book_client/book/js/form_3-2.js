const API_BASE_URL = "http://localhost:8080";

let editingBookId = null;

const bookForm = document.getElementById("bookForm");
const bookTableBody = document.getElementById("bookTableBody");
const submitButton = bookForm.querySelector("button[type='submit']");
const cancelButton = bookForm.querySelector(".cancel-btn");
const formError = document.getElementById("formError");

document.addEventListener("DOMContentLoaded", () => {
  loadBooks();
});

bookForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const bookFormData = new FormData(bookForm);
  const bookData = {
    title: bookFormData.get("title").trim(),
    author: bookFormData.get("author").trim(),
    price: bookFormData.get("price").trim(),
    isbn: bookFormData.get("isbn").trim(),
    publishDate: bookFormData.get("publish_date") || null,
    detailRequest: {
      description: bookFormData.get("description")?.trim() || null,
      language: bookFormData.get("language")?.trim() || null,
      pageCount: parseInt(bookFormData.get("pageCount")) || null,
      publisher: bookFormData.get("publisher")?.trim() || null,
      coverImageUrl: bookFormData.get("coverImageUrl")?.trim() || null,
      edition: bookFormData.get("edition")?.trim() || null,
    }
  };

  if (!validateBook(bookData)) return;

  if (editingBookId) {
    updateBook(editingBookId, bookData);
  } else {
    createBook(bookData);
  }
});

function validateBook(book) {
  if (!book.title) {
    alert("제목을 입력해주세요.");
    return false;
  }
  if (!book.author) {
    alert("작가를 입력해주세요.");
    return false;
  }
  if (!book.price) {
    alert("가격을 입력해주세요.");
    return false;
  }
  if (!book.isbn) {
    alert("ISBN을 입력해주세요.");
    return false;
  }
  if (!book.publishDate) {
    alert("발행일을 입력해주세요.");
    return false;
  }

  const isbnPattern = /^[0-9]{13}$/;
  if (!isbnPattern.test(book.isbn)) {
    alert("ISBN은 13자리 숫자만 입력 가능합니다.");
    return false;
  }

  if (isNaN(book.price) || Number(book.price) < 0) {
    alert("가격은 0 이상의 숫자여야 합니다.");
    return false;
  }

  const detail = book.detailRequest;
  if (!detail) {
    alert("도서 상세 정보를 입력해주세요.");
    return false;
  }

  if (!detail.coverImageUrl) {
    alert("표지 이미지 URL을 입력해주세요.");
    return false;
  }
  if (!detail.description) {
    alert("도서 설명을 입력해주세요.");
    return false;
  }
  if (!detail.language) {
    alert("언어를 입력해주세요.");
    return false;
  }
  if (!detail.publisher) {
    alert("출판사를 입력해주세요.");
    return false;
  }
  if (!detail.pageCount || isNaN(detail.pageCount) || Number(detail.pageCount) <= 0) {
    alert("페이지 수는 1 이상 숫자여야 합니다.");
    return false;
  }

  return true;
}

function loadBooks() {
  fetch(`${API_BASE_URL}/api/books`)
    .then((res) => {
      if (!res.ok) throw new Error("도서 목록을 불러오는데 실패했습니다!");
      return res.json();
    })
    .then((books) => renderBookTable(books))
    .catch((err) => {
      showError(err.message);
      bookTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; color:#dc3545">
            오류: 데이터를 불러올 수 없습니다.
          </td>
        </tr>
      `;
    });
}

function renderBookTable(books) {
  bookTableBody.innerHTML = "";

  books.forEach((book) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${book.title}</td>
      <td>${book.author}</td>
      <td>${book.price}</td>
      <td>${book.isbn}</td>
      <td>${book.publishDate || "-"}</td>
      <td>
        <button class="edit-btn" onclick="editBook(${book.id})">수정</button>
        <button class="delete-btn" onclick="deleteBook(${book.id})">삭제</button>
      </td>
    `;
    bookTableBody.appendChild(row);
  });
}

function createBook(bookData) {
  fetch(`${API_BASE_URL}/api/books`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bookData),
  })
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "도서 등록에 실패했습니다.");
      }
      return res.json();
    })
    .then((result) => {
      showSuccess("도서가 성공적으로 등록되었습니다!");
      resetForm();
      loadBooks();
    })
    .catch((err) => showError(err.message));
}

function deleteBook(bookId) {
  if (!confirm(`ID = ${bookId} 인 도서를 정말 삭제하시겠습니까?`)) return;

  fetch(`${API_BASE_URL}/api/books/${bookId}`, { method: "DELETE" })
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "도서 삭제에 실패했습니다.");
      }
      showSuccess("도서가 성공적으로 삭제되었습니다!");
      loadBooks();
    })
    .catch((err) => showError(err.message));
}

function editBook(bookId) {
  fetch(`${API_BASE_URL}/api/books/${bookId}`)
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "존재하지 않는 도서입니다.");
      }
      return res.json();
    })
    .then((book) => {
      bookForm.title.value = book.title;
      bookForm.author.value = book.author;
      bookForm.price.value = book.price;
      bookForm.isbn.value = book.isbn;
      bookForm.publish_date.value = book.publishDate || "";

      if (book.detail) {
        bookForm.description.value = book.detail.description || "";
        bookForm.language.value = book.detail.language || "";
        bookForm.pageCount.value = book.detail.pageCount || "";
        bookForm.publisher.value = book.detail.publisher || "";
        bookForm.coverImageUrl.value = book.detail.coverImageUrl || "";
        bookForm.edition.value = book.detail.edition || "";
      }

      editingBookId = bookId;
      submitButton.textContent = "도서 수정";
      cancelButton.style.display = 'inline-block';
    })
    .catch((err) => showError(err.message));
}

function resetForm() {
  bookForm.reset();
  editingBookId = null;
  submitButton.textContent = "도서 등록";
  cancelButton.style.display = 'none';
}

function updateBook(bookId, bookData) {
  fetch(`${API_BASE_URL}/api/books/${bookId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bookData),
  })
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "도서 수정에 실패했습니다.");
      }
      return res.json();
    })
    .then((result) => {
      showSuccess("도서가 성공적으로 수정되었습니다!");
      resetForm();
      loadBooks();
    })
    .catch((err) => showError(err.message));
}

function showSuccess(message) {
  formError.textContent = message;
  formError.style.display = "block";
  formError.style.color = "#28a745";
}

function showError(message) {
  formError.textContent = message;
  formError.style.display = "block";
  formError.style.color = "#dc3545";
}

function clearMessages() {
  formError.style.display = "none";
}
