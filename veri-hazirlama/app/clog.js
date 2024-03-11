function clog(level, msg, clabel) {
  if (level > 3) {
    if (clabel) console.log(clabel);
    console.log(msg);
  }
}

module.exports = clog;
