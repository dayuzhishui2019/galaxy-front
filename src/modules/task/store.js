const URLS = {
    LIST: "/api/task/list",
    SAVE: "/api/task/save",
    BATCH_SAVE: "/api/task/batchSave",
    REMOVE: "/api/task/remove"
  };
  
  export default {
    list(filter) {
      return $http({
        url: URLS.LIST,
        type: "GET",
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
  