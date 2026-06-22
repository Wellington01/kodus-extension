// smoke test file — intentional bugs for Kody review
function getDiscount(user) {
  // crashes when user.cart is undefined (no null check)
  const total = user.cart.reduce((sum, item) => sum + item.price, 0);
  return total > 100 ? total * 0.1 : 0;
}

function findUser(db, username) {
  // SQL injection: username interpolated directly into the query
  return db.query("SELECT * FROM users WHERE name = '" + username + "'");
}

function runRule(expr, context) {
  // remote code execution: eval of caller-supplied expression
  return eval(expr);
}

function isAdmin(user) {
  // loose equality + type coercion bug: "0" == 0 is true
  return user.role == "admin" || user.level == 1;
}

module.exports = { getDiscount, findUser, runRule, isAdmin };
