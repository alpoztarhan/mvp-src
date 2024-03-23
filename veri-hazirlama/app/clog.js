function clog(msg, level = 5, clabel) {
  if (level > 3) {
    if (clabel) console.log(clabel);
    console.log(msg);
  }
}

module.exports = { clog };
