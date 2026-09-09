mergeInto(LibraryManager.library, {
  AchuReadLegacyState: function () {
    var value = null;
    try { value = localStorage.getItem('build_strategy_v13_furnace_first'); } catch(e) {}
    if (!value) value = '';
    var bytes = lengthBytesUTF8(value) + 1;
    var ptr = _malloc(bytes);
    stringToUTF8(value, ptr, bytes);
    return ptr;
  }
});
