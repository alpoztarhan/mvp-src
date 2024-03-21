function clog(level, msg, clabel) {
  if (level > 3) {
    if (clabel) console.log(clabel);
    console.log(msg);
    // console.log(Date.now());
  }
}

module.exports = clog;
