const URLS = {
  LIST: "/api/resource/list",
  SAVE: "/api/resource/save",
  BATCH_SAVE: "/api/resource/batchSave",
  REMOVE: "/api/resource/remove"
};

export default {
  list(filter) {
    return $http({
      url: URLS.LIST,
      type: "POST",
      data: filter
    });
  },
  save(model) {
    return $http({
      url: URLS.SAVE,
      type: "POST",
      data: model
    });
  },
  batchSave(models) {
    return $http({
      url: URLS.BATCH_SAVE,
      type: "POST",
      data: {
        resources: models
      }
    });
  },
  remove(ids) {
    return $http({
      url: URLS.REMOVE,
      type: "POST",
      data: {
        ids: ids
      }
    });
  }
};
