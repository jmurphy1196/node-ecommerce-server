var stripe = Stripe(
  "pk_test_51HQpJdCQYjrZIeTCV7Ba4wJjAbNxrPRemByk28KjaZrGUWc12Y2wUGSHsRDtg7RJuiK5sKxZAWlHM3Fh7LoITEfV00CeOmBG4b"
);
var orderBtn = document.getElementById("order-btn");
orderBtn.addEventListener("click", function () {
  stripe.redirectToCheckout({
    sessionId: "<%= sessionId %>",
  });
});
