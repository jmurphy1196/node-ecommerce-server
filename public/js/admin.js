const deleteProduct = (btn) => {
  console.log("clicked!");

  const productId = btn.parentNode.querySelector("[name=productId]").value;
  const csrf = btn.parentNode.querySelector("[name=_csrf]").value;
  const productElement = btn.closest("article");

  fetch(`/admin/product/${productId}`, {
    method: "DELETE",
    headers: {
      "csrf-token": csrf,
    },
  })
    .then((result) => {
      return result.json();
    })
    .then((data) => {
      productElement.parentNode.removeChild(productElement);
    })
    .catch((err) => console.log(err));
};

let deleteBtns = document.querySelectorAll(".delete-btn");

deleteBtns = Array.from(deleteBtns);

deleteBtns.forEach((deleteBtn) => {
  deleteBtn.addEventListener("click", () => {
    let productId = deleteBtn.parentNode.querySelector("[name=productId]")
      .value;
    let csrf = deleteBtn.parentNode.querySelector("[name=_csrf]").value;
    let productElement = deleteBtn.closest("article");

    fetch(`/admin/product/${productId}`, {
      method: "DELETE",
      headers: {
        "csrf-token": csrf,
      },
    })
      .then((result) => {
        return result.json();
      })
      .then((data) => {
        productElement.parentNode.removeChild(productElement);
      })
      .catch((err) => console.log(err));
  });
});
