function problem(res, status, title, detail) {
  return res.status(status).type("application/problem+json").json({
    type: "about:blank",
    title,
    status,
    detail
  });
}

module.exports = {
  problem
};
