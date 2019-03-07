exports.invokeAsPromise = (obj, func, ...params) => {
    return new Promise((resolve, reject) => {
        obj[func](...params, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
};
